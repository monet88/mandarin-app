// Client-side helpers for HSK mock exam sessions
import { supabase } from "@/utils/supabase";

export type ExamSection = "listening" | "reading" | "writing";

export interface AudioManifest {
  question_id: string;
  storage_path: string;
  duration_seconds: number | null;
}

export interface ExamSession {
  session_id: string;
  hsk_level: number;
  started_at: string;
  expires_at: string;
  section_deadlines: Record<ExamSection, string>;
  question_ids: string[];
  audio_manifests: AudioManifest[];
}

export interface ExamScores {
  listening: number;
  reading: number;
  writing: number;
  total: number;
  passed: boolean;
}

export interface QuestionBankRow {
  id: string;
  section: ExamSection;
  question_type: string;
  question_data: Record<string, unknown>;
}

export interface SectionAnswers {
  [questionId: string]: string | string[];
}

// Start a new exam session via Edge Function
export async function startExamSession(hskLevel: number): Promise<ExamSession> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const res = await fetch(`${supabaseUrl}/functions/v1/hsk-mock-exam-start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ hsk_level: hskLevel }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to start exam");
  return json as ExamSession;
}

// Fetch question details for a list of IDs
export async function fetchQuestions(ids: string[]): Promise<QuestionBankRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("hsk_question_bank")
    .select("id, section, question_type, question_data")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return (data ?? []) as QuestionBankRow[];
}

// Submit answers for one section
export async function submitSection(
  sessionId: string,
  section: ExamSection,
  answers: SectionAnswers,
  isInterruption = false,
): Promise<{ status: string; scores?: ExamScores }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const res = await fetch(`${supabaseUrl}/functions/v1/hsk-mock-exam-submit-section`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      section,
      answers,
      is_interruption: isInterruption,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to submit section");
  return json;
}

// Evaluate a writing submission
export async function evaluateWriting(
  writingText: string,
  promptText: string,
  hskLevel: number,
): Promise<{ rubric: WritingRubric; fallback: boolean }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const res = await fetch(`${supabaseUrl}/functions/v1/hsk-writing-evaluate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writing_text: writingText, prompt_text: promptText, hsk_level: hskLevel }),
  });

  const json = await res.json();
  // Never throw — always return (fallback if needed)
  return json;
}

export interface WritingRubric {
  content_score: number;
  grammar_score: number;
  vocabulary_score: number;
  structure_score: number;
  total_score: number;
  feedback: string;
  corrections: string[];
}

// Milliseconds remaining until a deadline string
export function msUntil(isoDeadline: string): number {
  return Math.max(0, new Date(isoDeadline).getTime() - Date.now());
}

// Section index helpers
export const SECTIONS: ExamSection[] = ["listening", "reading", "writing"];
export const QUESTIONS_PER_SECTION = 5;

export function questionsForSection(allIds: string[], section: ExamSection): string[] {
  const idx = SECTIONS.indexOf(section);
  const start = idx * QUESTIONS_PER_SECTION;
  return allIds.slice(start, start + QUESTIONS_PER_SECTION);
}
