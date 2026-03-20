import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  corsPreflightResponse,
  jsonResponse,
  unauthorizedResponse,
  errorResponse,
  FREE_DAILY_EXAM_QUOTA,
  isPremiumActive,
  validateHskLevel,
} from "../_shared/hsk-events.ts";

type ExamSection = "listening" | "reading" | "writing";

interface PublicQuestionRow {
  id: string;
  section: ExamSection;
  question_type: string;
  question_data: Record<string, unknown>;
}

// Section durations in minutes per HSK level (simplified uniform for mock)
const SECTION_DURATIONS_MIN: Record<ExamSection, number> = {
  listening: 20,
  reading: 25,
  writing: 15,
};

const QUESTIONS_PER_SECTION = 5;
const EXAM_SECTIONS: ExamSection[] = ["listening", "reading", "writing"];

function sanitizeQuestionData(questionData: Record<string, unknown>): Record<string, unknown> {
  // Never expose answer-bearing fields to the client.
  const sanitized = { ...questionData };
  delete sanitized.answer;
  delete sanitized.answers;
  delete sanitized.correct_answer;
  delete sanitized.correct_answers;
  return sanitized;
}

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
    const now = new Date();
    const todayUtc = new Date(now);
    todayUtc.setUTCHours(0, 0, 0, 0);

    const { data: profile, error: profileErr } = await serviceClient
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      throw new Error(`Failed to load profile: ${profileErr.message}`);
    }

    const premium = isPremiumActive(profile);
    if (!premium && hskLevel > 1) {
      return jsonResponse(
        {
          error: "Premium required for HSK 2-6 mock exams",
          code: "premium_required",
        },
        403,
      );
    }

    // Expire stale active sessions before blocking a new start.
    const { data: activeSessions, error: activeErr } = await serviceClient
      .from("hsk_exam_sessions")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("started_at", { ascending: false });

    if (activeErr) {
      throw new Error(`Failed to check active sessions: ${activeErr.message}`);
    }

    const staleSessionIds = (activeSessions ?? [])
      .filter((session) => new Date(session.expires_at) <= now)
      .map((session) => session.id);

    if (staleSessionIds.length > 0) {
      const { error: expireErr } = await serviceClient
        .from("hsk_exam_sessions")
        .update({ status: "expired" })
        .eq("user_id", user.id)
        .in("id", staleSessionIds);

      if (expireErr) {
        throw new Error(`Failed to expire stale sessions: ${expireErr.message}`);
      }
    }

    const liveSession = (activeSessions ?? []).find(
      (session) => new Date(session.expires_at) > now,
    );

    if (liveSession) {
      return jsonResponse(
        {
          error: "Active exam session already exists",
          session_id: liveSession.id,
        },
        409,
      );
    }

    if (!premium) {
      const { count: examsToday, error: quotaErr } = await serviceClient
        .from("hsk_exam_results")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("completed_at", todayUtc.toISOString());

      if (quotaErr) {
        throw new Error(`Failed to check daily exam quota: ${quotaErr.message}`);
      }

      if ((examsToday ?? 0) >= FREE_DAILY_EXAM_QUOTA) {
        return jsonResponse(
          {
            error: "Free daily exam quota reached",
            code: "daily_quota_reached",
          },
          403,
        );
      }
    }

    // Select questions from bank: QUESTIONS_PER_SECTION per section
    const sections: ExamSection[] = EXAM_SECTIONS;
    const questionIds: string[] = [];
    const publicQuestions: PublicQuestionRow[] = [];

    for (const section of sections) {
      const { data: questions, error: qErr } = await serviceClient
        .from("hsk_question_bank")
        .select("id, section, question_type, question_data")
        .eq("hsk_level", hskLevel)
        .eq("section", section)
        .eq("status", "valid")
        .order("generated_at", { ascending: false })
        .limit(QUESTIONS_PER_SECTION);

      if (qErr) throw new Error(`Failed to fetch ${section} questions: ${qErr.message}`);
      if (!questions || questions.length === 0) {
        return jsonResponse({ error: `No valid ${section} questions available for HSK ${hskLevel}` }, 422);
      }
      questionIds.push(...questions.map((q: { id: string }) => q.id));
      publicQuestions.push(
        ...questions.map((q: {
          id: string;
          section: ExamSection;
          question_type: string;
          question_data: Record<string, unknown>;
        }) => ({
          id: q.id,
          section: q.section,
          question_type: q.question_type,
          question_data: sanitizeQuestionData(q.question_data ?? {}),
        })),
      );
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
        current_section: "listening",
        section_deadlines: sectionDeadlines,
        expires_at: expiresAt,
      })
      .select("id, started_at, expires_at")
      .single();

    if (insertErr) {
      // Unique index violation = concurrent session creation race
      if (insertErr.code === "23505") {
        return jsonResponse(
          { error: "Active exam session already exists" },
          409,
        );
      }
      throw new Error(`Failed to create session: ${insertErr.message}`);
    }
    if (!session) throw new Error("Failed to create session: no data returned");

    // Fetch audio manifests for listening questions
    const listeningIds = questionIds.slice(0, QUESTIONS_PER_SECTION);
    const { data: audioManifests } = await serviceClient
      .from("hsk_audio_manifests")
      .select("question_id, storage_path, duration_seconds")
      .in("question_id", listeningIds)
      .eq("status", "ready");

    // Only return listening section questions initially — reading/writing delivered on section submit.
    const listeningQuestions = publicQuestions.filter((q) => q.section === "listening");

    return jsonResponse({
      session_id: session.id,
      hsk_level: hskLevel,
      started_at: session.started_at,
      expires_at: session.expires_at,
      section_deadlines: sectionDeadlines,
      question_ids: questionIds,
      questions: listeningQuestions,
      audio_manifests: audioManifests ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("hsk-mock-exam-start error:", msg);
    return errorResponse(msg);
  }
});
