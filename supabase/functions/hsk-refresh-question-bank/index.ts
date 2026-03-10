import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  type HskLevel,
  corsPreflightResponse,
  errorResponse,
  jsonResponse,
  unauthorizedResponse,
  validateHskLevel,
} from "../_shared/hsk-events.ts";

// Questions generated per section per refresh call
const QUESTIONS_PER_SECTION = 10;

const SECTIONS = ["listening", "reading", "writing"] as const;
type Section = (typeof SECTIONS)[number];

// Question type map per section
const SECTION_QUESTION_TYPES: Record<Section, string[]> = {
  listening: ["multiple_choice"],
  reading: ["multiple_choice", "passage_mc", "fill_blank"],
  writing: ["ordering", "fill_blank"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return unauthorizedResponse();

    // Auth validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return unauthorizedResponse();

    // Only service role or premium users may trigger refreshes
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    const premiumActive =
      !!profile?.is_premium &&
      (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date());

    if (!premiumActive) {
      return jsonResponse({ error: "Premium required to refresh question bank" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { hsk_level, section } = body as { hsk_level?: unknown; section?: unknown };

    if (!validateHskLevel(hsk_level)) {
      return jsonResponse({ error: "hsk_level must be 1–6" }, 400);
    }

    const targetSections: Section[] = section && SECTIONS.includes(section as Section)
      ? [section as Section]
      : [...SECTIONS];

    const results: { section: string; generated: number; quarantined: number }[] = [];

    for (const sec of targetSections) {
      const { generated, quarantined } = await generateQuestionsForSection(
        adminClient,
        openrouterApiKey,
        hsk_level as HskLevel,
        sec,
      );
      results.push({ section: sec, generated, quarantined });
    }

    return jsonResponse({
      hsk_level,
      sections_refreshed: targetSections,
      results,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(msg);
  }
});

async function generateQuestionsForSection(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  openrouterApiKey: string,
  hskLevel: HskLevel,
  section: Section,
): Promise<{ generated: number; quarantined: number }> {
  const questionTypes = SECTION_QUESTION_TYPES[section];
  const prompt = buildGenerationPrompt(hskLevel, section, questionTypes, QUESTIONS_PER_SECTION);

  const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openrouterApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!aiResponse.ok) {
    throw new Error(`AI generation failed: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const content = JSON.parse(aiData.choices[0].message.content);
  const questions: unknown[] = Array.isArray(content.questions) ? content.questions : [];

  let generated = 0;
  let quarantined = 0;

  for (const q of questions) {
    const { valid, reason } = validateQuestion(q, hskLevel, section);
    const row = {
      hsk_level: hskLevel,
      section,
      question_type: (q as Record<string, unknown>).question_type ?? questionTypes[0],
      question_data: q,
      vocab_ceiling: (q as Record<string, unknown>).vocab_used ?? null,
      status: valid ? "valid" : "quarantined",
      validated_at: new Date().toISOString(),
    };

    if (!valid) {
      console.warn(`Quarantined question: ${reason}`);
      quarantined++;
    } else {
      generated++;
    }

    await adminClient.from("hsk_question_bank").insert(row);
  }

  return { generated, quarantined };
}

function buildGenerationPrompt(
  level: HskLevel,
  section: Section,
  types: string[],
  count: number,
): string {
  return `Generate ${count} HSK Level ${level} ${section} exam questions.
Question types to use: ${types.join(", ")}.

Rules:
- All vocabulary MUST be within HSK Level ${level} word list.
- For listening: include a short dialogue or monologue script (in Chinese) as "script" field.
- For reading: include a short passage (in Chinese) as "passage" field for passage_mc questions.
- For writing: provide character ordering or fill-in-the-blank tasks.
- Each question must have: question_type, prompt (in Chinese), options (array for MC), correct_answer, explanation, vocab_used (array of words from the question).

Return a JSON object: { "questions": [...] }
No markdown, raw JSON only.`;
}

function validateQuestion(
  q: unknown,
  _level: HskLevel,
  _section: Section,
): { valid: boolean; reason?: string } {
  if (!q || typeof q !== "object") return { valid: false, reason: "Not an object" };
  const question = q as Record<string, unknown>;

  if (!question.prompt || typeof question.prompt !== "string") {
    return { valid: false, reason: "Missing prompt" };
  }
  if (!question.correct_answer) {
    return { valid: false, reason: "Missing correct_answer" };
  }
  if (!Array.isArray(question.options) || question.options.length < 2) {
    // Only required for MC types — allow non-MC to pass
    if (question.question_type === "multiple_choice" || question.question_type === "passage_mc") {
      return { valid: false, reason: "MC question needs at least 2 options" };
    }
  }
  return { valid: true };
}
