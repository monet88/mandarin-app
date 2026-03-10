#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read
/**
 * generate-hsk-listening-audio.ts
 *
 * Offline pipeline script: fetches pending listening questions from
 * hsk_question_bank, generates TTS audio via Azure Cognitive Services,
 * uploads to Supabase Storage, then writes manifest rows to hsk_audio_manifests.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... AZURE_TTS_KEY=... AZURE_TTS_REGION=... \
 *   deno run --allow-net --allow-env scripts/generate-hsk-listening-audio.ts [--level 3]
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

// Azure TTS voice map per HSK level (zh-CN voices)
const LEVEL_VOICE: Record<number, string> = {
  1: "zh-CN-XiaoxiaoNeural",
  2: "zh-CN-XiaoxiaoNeural",
  3: "zh-CN-YunxiNeural",
  4: "zh-CN-YunxiNeural",
  5: "zh-CN-YunjianNeural",
  6: "zh-CN-YunjianNeural",
};

const STORAGE_BUCKET = "hsk-audio";

interface QuestionRow {
  id: string;
  hsk_level: number;
  question_data: {
    script?: string;
    prompt?: string;
  };
}

async function main() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const azureKey = Deno.env.get("AZURE_TTS_KEY");
  const azureRegion = Deno.env.get("AZURE_TTS_REGION");

  if (!supabaseUrl || !serviceKey || !azureKey || !azureRegion) {
    console.error(
      "Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AZURE_TTS_KEY, AZURE_TTS_REGION",
    );
    Deno.exit(1);
  }

  const levelArg = Deno.args.indexOf("--level");
  const targetLevel: number | null = levelArg >= 0
    ? parseInt(Deno.args[levelArg + 1], 10)
    : null;

  const adminClient = createClient(supabaseUrl, serviceKey);

  // Fetch valid listening questions without a ready audio manifest
  let query = adminClient
    .from("hsk_question_bank")
    .select("id, hsk_level, question_data")
    .eq("section", "listening")
    .eq("status", "valid")
    .not(
      "id",
      "in",
      adminClient
        .from("hsk_audio_manifests")
        .select("question_id")
        .eq("status", "ready"),
    );

  if (targetLevel) {
    query = query.eq("hsk_level", targetLevel);
  }

  const { data: questions, error } = await query;
  if (error) {
    console.error("Failed to fetch questions:", error.message);
    Deno.exit(1);
  }

  if (!questions || questions.length === 0) {
    console.log("No pending listening questions found.");
    return;
  }

  console.log(`Processing ${questions.length} questions...`);

  let successCount = 0;
  let errorCount = 0;

  for (const q of questions as QuestionRow[]) {
    try {
      const text = q.question_data.script ?? q.question_data.prompt ?? "";
      if (!text.trim()) {
        console.warn(`  [SKIP] ${q.id} — no text content`);
        continue;
      }

      const voice = LEVEL_VOICE[q.hsk_level] ?? "zh-CN-XiaoxiaoNeural";

      // Insert pending manifest row first (idempotent marker)
      const { data: manifest, error: insertErr } = await adminClient
        .from("hsk_audio_manifests")
        .insert({
          question_id: q.id,
          hsk_level: q.hsk_level,
          storage_path: "",
          voice_id: voice,
          status: "pending",
        })
        .select("id")
        .single();

      if (insertErr) {
        console.warn(`  [SKIP] ${q.id} — manifest already exists or insert failed`);
        continue;
      }

      // Generate TTS via Azure
      const audioBuffer = await generateTts(text, voice, azureKey, azureRegion);
      const storagePath = `${q.hsk_level}/${q.id}.mp3`;

      // Upload to Supabase Storage
      const { error: uploadErr } = await adminClient.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, audioBuffer, {
          contentType: "audio/mpeg",
          upsert: true,
        });

      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

      // Estimate duration (rough: ~3 chars/sec for Mandarin TTS)
      const estimatedDuration = Math.ceil(text.length / 3);

      // Update manifest to ready
      await adminClient
        .from("hsk_audio_manifests")
        .update({
          storage_path: storagePath,
          duration_seconds: estimatedDuration,
          status: "ready",
        })
        .eq("id", manifest.id);

      console.log(`  [OK] ${q.id} → ${storagePath}`);
      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERR] ${q.id}: ${msg}`);

      // Mark manifest as error for retry
      await adminClient
        .from("hsk_audio_manifests")
        .update({ status: "error" })
        .eq("question_id", q.id)
        .eq("status", "pending");

      errorCount++;
    }
  }

  console.log(`\nDone. Success: ${successCount}, Errors: ${errorCount}`);
}

async function generateTts(
  text: string,
  voice: string,
  apiKey: string,
  region: string,
): Promise<Uint8Array> {
  const ssml = `<speak version='1.0' xml:lang='zh-CN'>
    <voice name='${voice}'>${escapeXml(text)}</voice>
  </speak>`;

  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-48khz-192kbitrate-mono-mp3",
      },
      body: ssml,
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Azure TTS error ${response.status}: ${errText}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

await main();
