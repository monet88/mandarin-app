import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  corsPreflightResponse,
  jsonResponse,
  unauthorizedResponse,
  errorResponse,
} from "../_shared/hsk-events.ts";

interface SectionAnswers {
  [questionId: string]: string | string[];
}

type ExamSection = "listening" | "reading" | "writing";
const SECTION_ORDER: ExamSection[] = ["listening", "reading", "writing"];

function scoreAnswers(
  questionIds: string[],
  answers: SectionAnswers,
  bankMap: Record<string, { question_data: { correct_answer?: string; answer?: string; answers?: string[] } }>,
): { correct: number; total: number } {
  let correct = 0;
  for (const qid of questionIds) {
    const bank = bankMap[qid];
    if (!bank) continue;
    const submitted = answers[qid];
    const expected = expectedAnswerForQuestion(bank.question_data);
    if (
      submitted !== undefined &&
      expected !== undefined &&
      normalizeAnswer(submitted) === expected
    ) {
      correct++;
    }
  }
  return { correct, total: questionIds.length };
}

function expectedAnswerForQuestion(
  questionData: { correct_answer?: string; answer?: string; answers?: string[] },
): string | undefined {
  const expected =
    questionData.correct_answer ??
    questionData.answer ??
    questionData.answers?.[0];
  return expected !== undefined ? normalizeAnswer(expected) : undefined;
}

function normalizeAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => String(v)).join("|");
  return String(value);
}

function parseSectionDeadlines(raw: unknown): Partial<Record<ExamSection, string>> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const parsed: Partial<Record<ExamSection, string>> = {};
  for (const section of SECTION_ORDER) {
    if (typeof obj[section] === "string") {
      parsed[section] = obj[section] as string;
    }
  }
  return parsed;
}

function inferCurrentSectionFromAnswers(rawAnswers: unknown): ExamSection {
  if (!rawAnswers || typeof rawAnswers !== "object") return "listening";
  const answers = rawAnswers as Record<string, unknown>;
  if (!answers.__section_listening_submitted) return "listening";
  if (!answers.__section_reading_submitted) return "reading";
  return "writing";
}

function toScoresRow(row: {
  listening_score: number | null;
  reading_score: number | null;
  writing_score: number | null;
  total_score: number | null;
  passed: boolean | null;
}) {
  return {
    listening: row.listening_score ?? 0,
    reading: row.reading_score ?? 0,
    writing: row.writing_score ?? 0,
    total: row.total_score ?? 0,
    passed: row.passed ?? false,
  };
}

async function loadExistingScores(
  // deno-lint-ignore no-explicit-any
  serviceClient: any,
  sessionId: string,
): Promise<{
  listening_score: number | null;
  reading_score: number | null;
  writing_score: number | null;
  total_score: number | null;
  passed: boolean | null;
} | null> {
  const { data } = await serviceClient
    .from("hsk_exam_results")
    .select("listening_score, reading_score, writing_score, total_score, passed")
    .eq("session_id", sessionId)
    .maybeSingle();
  return data ?? null;
}

async function buildAnswerKey(
  // deno-lint-ignore no-explicit-any
  serviceClient: any,
  questionIds: string[],
): Promise<Record<string, string>> {
  const answerKey: Record<string, string> = {};
  if (questionIds.length === 0) return answerKey;

  const { data: bankRows } = await serviceClient
    .from("hsk_question_bank")
    .select("id, question_data")
    .in("id", questionIds);

  for (const row of bankRows ?? []) {
    const questionData = row.question_data as {
      correct_answer?: string;
      answer?: string;
      answers?: string[];
    };
    const expected = expectedAnswerForQuestion(questionData);
    if (expected !== undefined) {
      answerKey[row.id] = expected;
    }
  }

  return answerKey;
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
    const { session_id, section, answers, is_interruption } = body as {
      session_id: string;
      section: ExamSection;
      answers: SectionAnswers;
      is_interruption?: boolean;
    };

    if (!session_id || !section || !answers) {
      return jsonResponse({ error: "Missing required fields: session_id, section, answers" }, 400);
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);

    // Fetch session
    const { data: session, error: sessionErr } = await serviceClient
      .from("hsk_exam_sessions")
      .select("id, user_id, status, question_ids, answers, expires_at, hsk_level, current_section, section_deadlines")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionErr || !session) return jsonResponse({ error: "Session not found" }, 404);
    if (session.status === "submitted") {
      const existing = await loadExistingScores(serviceClient, session_id);
      if (existing) {
        const answerKey = await buildAnswerKey(serviceClient, session.question_ids ?? []);
        return jsonResponse({
          status: "submitted",
          scores: toScoresRow(existing),
          answer_key: answerKey,
        });
      }
      return jsonResponse({ error: "Submitted session has no persisted result" }, 409);
    }
    if (session.status !== "active") return jsonResponse({ error: "Session is not active" }, 409);
    if (!SECTION_ORDER.includes(section)) {
      return jsonResponse({ error: `Invalid section: ${section}` }, 400);
    }

    const now = new Date();
    const isExpired = new Date(session.expires_at) <= now;
    const currentSection =
      (session.current_section as ExamSection | null) ?? inferCurrentSectionFromAnswers(session.answers);
    if (section !== currentSection) {
      return jsonResponse(
        {
          error: `Section out of order. Expected ${currentSection}, received ${section}`,
          expected_section: currentSection,
        },
        409,
      );
    }

    const sectionDeadlines = parseSectionDeadlines(session.section_deadlines);
    const sectionDeadlineIso = sectionDeadlines[section] ?? session.expires_at;
    const sectionExpired = new Date(sectionDeadlineIso) <= now;
    if (sectionExpired) {
      // Expire the session to avoid users being stuck behind an active-but-unsubmittable session.
      await serviceClient
        .from("hsk_exam_sessions")
        .update({
          status: "expired",
          current_section: null,
          submitted_at: now.toISOString(),
        })
        .eq("id", session_id)
        .eq("status", "active");
      return jsonResponse(
        {
          error: `Section deadline exceeded for ${section}`,
          code: "section_deadline_exceeded",
          deadline: sectionDeadlineIso,
          status: "expired",
        },
        409,
      );
    }

    // Merge answers into session (server-side merge)
    const mergedAnswers = { ...(session.answers ?? {}), ...answers };

    // Mark section as submitted in merged answers sentinel
    mergedAnswers[`__section_${section}_submitted`] = now.toISOString();
    if (is_interruption) {
      mergedAnswers[`__section_${section}_auto_submitted`] = true;
    }

    const sectionIndex = SECTION_ORDER.indexOf(section);
    const nextSection = SECTION_ORDER[sectionIndex + 1];
    const allSectionsDone = sectionIndex === SECTION_ORDER.length - 1;
    const newStatus = allSectionsDone || isExpired ? "submitted" : "active";

    // Optimistic update guards against concurrent section submissions.
    let updateQuery = serviceClient
      .from("hsk_exam_sessions")
      .update({
        answers: mergedAnswers,
        status: newStatus,
        current_section: newStatus === "active" ? nextSection : null,
        ...(newStatus === "submitted" ? { submitted_at: now.toISOString() } : {}),
      })
      .eq("id", session_id)
      .eq("status", "active");

    if (session.current_section) {
      updateQuery = updateQuery.eq("current_section", currentSection);
    }

    const { data: updatedSession, error: updateErr } = await updateQuery
      .select("id, hsk_level, question_ids")
      .maybeSingle();

    if (updateErr) throw new Error(`Failed to update session: ${updateErr.message}`);
    if (!updatedSession) {
      const existing = await loadExistingScores(serviceClient, session_id);
      if (existing) {
        const answerKey = await buildAnswerKey(serviceClient, session.question_ids ?? []);
        return jsonResponse({
          status: "submitted",
          scores: toScoresRow(existing),
          answer_key: answerKey,
        });
      }
      return jsonResponse(
        { error: "Session update conflict. Please refresh and retry." },
        409,
      );
    }

    // If fully submitted, compute final scores and persist results
    if (newStatus === "submitted") {
      const questionIds: string[] = updatedSession.question_ids ?? [];
      const perSection = Math.floor(questionIds.length / 3);
      const listeningIds = questionIds.slice(0, perSection);
      const readingIds = questionIds.slice(perSection, perSection * 2);
      const writingIds = questionIds.slice(perSection * 2);

      const { data: bankRows } = await serviceClient
        .from("hsk_question_bank")
        .select("id, question_data")
        .in("id", questionIds);

      const bankMap: Record<string, { question_data: { correct_answer?: string; answer?: string; answers?: string[] } }> = {};
      for (const row of bankRows ?? []) bankMap[row.id] = row;

      const listeningScore = scoreAnswers(listeningIds, mergedAnswers, bankMap);
      const readingScore = scoreAnswers(readingIds, mergedAnswers, bankMap);
      const writingScore = scoreAnswers(writingIds, mergedAnswers, bankMap);
      const answerKey: Record<string, string> = {};
      for (const questionId of questionIds) {
        const expected = bankMap[questionId]
          ? expectedAnswerForQuestion(bankMap[questionId].question_data)
          : undefined;
        if (expected !== undefined) {
          answerKey[questionId] = expected;
        }
      }

      const toPercent = (s: { correct: number; total: number }) =>
        s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;

      const ls = toPercent(listeningScore);
      const rs = toPercent(readingScore);
      const ws = toPercent(writingScore);
      const total = Math.round((ls + rs + ws) / 3);
      const passed = total >= 60;

      const { data: persisted, error: resultErr } = await serviceClient
        .from("hsk_exam_results")
        .upsert(
          {
            user_id: user.id,
            session_id: session_id,
            hsk_level: updatedSession.hsk_level,
            listening_score: ls,
            reading_score: rs,
            writing_score: ws,
            total_score: total,
            passed,
            completed_at: now.toISOString(),
          },
          { onConflict: "session_id" },
        )
        .select("listening_score, reading_score, writing_score, total_score, passed")
        .single();

      if (resultErr) throw new Error(`Failed to persist exam result: ${resultErr.message}`);

      return jsonResponse({
        status: "submitted",
        scores: toScoresRow(persisted),
        answer_key: answerKey,
      });
    }

    return jsonResponse({
      status: newStatus,
      section_submitted: section,
      next_section: nextSection ?? null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("hsk-mock-exam-submit-section error:", msg);
    return errorResponse(msg);
  }
});
