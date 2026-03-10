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

function scoreAnswers(
  questionIds: string[],
  answers: SectionAnswers,
  bankMap: Record<string, { question_data: { answer?: string; answers?: string[] } }>,
): { correct: number; total: number } {
  let correct = 0;
  for (const qid of questionIds) {
    const bank = bankMap[qid];
    if (!bank) continue;
    const submitted = answers[qid];
    const expected = bank.question_data.answer ?? bank.question_data.answers?.[0];
    if (submitted !== undefined && expected !== undefined && String(submitted) === String(expected)) {
      correct++;
    }
  }
  return { correct, total: questionIds.length };
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
      section: "listening" | "reading" | "writing";
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
      .select("id, user_id, status, question_ids, answers, expires_at, hsk_level")
      .eq("id", session_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionErr || !session) return jsonResponse({ error: "Session not found" }, 404);
    if (session.status !== "active") return jsonResponse({ error: "Session is not active" }, 409);

    const now = new Date();
    const isExpired = new Date(session.expires_at) < now;

    // Merge answers into session (server-side merge; late answers accepted if only slightly past deadline)
    const mergedAnswers = { ...(session.answers ?? {}), ...answers };

    // Mark section as submitted in merged answers sentinel
    mergedAnswers[`__section_${section}_submitted`] = now.toISOString();
    if (is_interruption) {
      mergedAnswers[`__section_${section}_auto_submitted`] = true;
    }

    // Determine if all sections are done
    const allSectionsDone =
      mergedAnswers["__section_listening_submitted"] &&
      mergedAnswers["__section_reading_submitted"] &&
      mergedAnswers["__section_writing_submitted"];

    const newStatus = allSectionsDone || isExpired ? "submitted" : "active";

    // Update session
    const { error: updateErr } = await serviceClient
      .from("hsk_exam_sessions")
      .update({
        answers: mergedAnswers,
        status: newStatus,
        ...(newStatus === "submitted" ? { submitted_at: now.toISOString() } : {}),
      })
      .eq("id", session_id);

    if (updateErr) throw new Error(`Failed to update session: ${updateErr.message}`);

    // If fully submitted, compute final scores and persist results
    if (newStatus === "submitted") {
      const questionIds: string[] = session.question_ids ?? [];
      const perSection = Math.floor(questionIds.length / 3);
      const listeningIds = questionIds.slice(0, perSection);
      const readingIds = questionIds.slice(perSection, perSection * 2);
      const writingIds = questionIds.slice(perSection * 2);

      const { data: bankRows } = await serviceClient
        .from("hsk_question_bank")
        .select("id, question_data")
        .in("id", questionIds);

      const bankMap: Record<string, { question_data: { answer?: string; answers?: string[] } }> = {};
      for (const row of bankRows ?? []) bankMap[row.id] = row;

      const listeningScore = scoreAnswers(listeningIds, mergedAnswers, bankMap);
      const readingScore = scoreAnswers(readingIds, mergedAnswers, bankMap);
      const writingScore = scoreAnswers(writingIds, mergedAnswers, bankMap);

      const toPercent = (s: { correct: number; total: number }) =>
        s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;

      const ls = toPercent(listeningScore);
      const rs = toPercent(readingScore);
      const ws = toPercent(writingScore);
      const total = Math.round((ls + rs + ws) / 3);
      const passed = total >= 60;

      await serviceClient.from("hsk_exam_results").insert({
        user_id: user.id,
        session_id: session_id,
        hsk_level: session.hsk_level,
        listening_score: ls,
        reading_score: rs,
        writing_score: ws,
        total_score: total,
        passed,
        completed_at: now.toISOString(),
      });

      return jsonResponse({ status: "submitted", scores: { listening: ls, reading: rs, writing: ws, total, passed } });
    }

    return jsonResponse({ status: newStatus, section_submitted: section });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("hsk-mock-exam-submit-section error:", msg);
    return errorResponse(msg);
  }
});
