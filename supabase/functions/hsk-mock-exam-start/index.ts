import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  corsPreflightResponse,
  jsonResponse,
  unauthorizedResponse,
  errorResponse,
  validateHskLevel,
} from "../_shared/hsk-events.ts";

// Section durations in minutes per HSK level (simplified uniform for mock)
const SECTION_DURATIONS_MIN: Record<string, number> = {
  listening: 20,
  reading: 25,
  writing: 15,
};

const QUESTIONS_PER_SECTION = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!authHeader) return unauthorizedResponse();

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return unauthorizedResponse();

    const body = await req.json();
    const hskLevel = body.hsk_level;
    if (!validateHskLevel(hskLevel)) {
      return jsonResponse({ error: "Invalid hsk_level (must be 1-6)" }, 400);
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Check for already-active session
    const { data: existing } = await serviceClient
      .from("hsk_exam_sessions")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return jsonResponse({ error: "Active exam session already exists", session_id: existing.id }, 409);
    }

    // Select questions from bank: QUESTIONS_PER_SECTION per section
    const sections = ["listening", "reading", "writing"];
    const questionIds: string[] = [];

    for (const section of sections) {
      const { data: questions, error: qErr } = await serviceClient
        .from("hsk_question_bank")
        .select("id")
        .eq("hsk_level", hskLevel)
        .eq("section", section)
        .eq("status", "valid")
        .limit(QUESTIONS_PER_SECTION);

      if (qErr) throw new Error(`Failed to fetch ${section} questions: ${qErr.message}`);
      if (!questions || questions.length === 0) {
        return jsonResponse({ error: `No valid ${section} questions available for HSK ${hskLevel}` }, 422);
      }
      questionIds.push(...questions.map((q: { id: string }) => q.id));
    }

    // Server-authoritative deadline: sum of all section durations
    const totalMinutes = Object.values(SECTION_DURATIONS_MIN).reduce((a, b) => a + b, 0);
    const expiresAt = new Date(Date.now() + totalMinutes * 60 * 1000).toISOString();

    // Build section deadlines map
    let cursor = Date.now();
    const sectionDeadlines: Record<string, string> = {};
    for (const section of sections) {
      cursor += SECTION_DURATIONS_MIN[section] * 60 * 1000;
      sectionDeadlines[section] = new Date(cursor).toISOString();
    }

    const { data: session, error: insertErr } = await serviceClient
      .from("hsk_exam_sessions")
      .insert({
        user_id: user.id,
        hsk_level: hskLevel,
        status: "active",
        question_ids: questionIds,
        answers: {},
        expires_at: expiresAt,
      })
      .select("id, started_at, expires_at")
      .single();

    if (insertErr || !session) throw new Error(`Failed to create session: ${insertErr?.message}`);

    // Fetch audio manifests for listening questions
    const listeningIds = questionIds.slice(0, QUESTIONS_PER_SECTION);
    const { data: audioManifests } = await serviceClient
      .from("hsk_audio_manifests")
      .select("question_id, storage_path, duration_seconds")
      .in("question_id", listeningIds)
      .eq("status", "ready");

    return jsonResponse({
      session_id: session.id,
      hsk_level: hskLevel,
      started_at: session.started_at,
      expires_at: session.expires_at,
      section_deadlines: sectionDeadlines,
      question_ids: questionIds,
      audio_manifests: audioManifests ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("hsk-mock-exam-start error:", msg);
    return errorResponse(msg);
  }
});
