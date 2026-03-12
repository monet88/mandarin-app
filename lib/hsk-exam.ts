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
  questions: QuestionBankRow[];
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

export interface SubmitSectionResponse {
  status: string;
  section_submitted?: ExamSection;
  next_section?: ExamSection | null;
  scores?: ExamScores;
  answer_key?: Record<string, string>;
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

const FALLBACK_WRITING_RUBRIC: WritingRubric = {
  content_score: 0,
  grammar_score: 0,
  vocabulary_score: 0,
  structure_score: 0,
  total_score: 0,
  feedback: "Evaluation unavailable. Please try again.",
  corrections: [],
};

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

// Submit answers for one section
export async function submitSection(
  sessionId: string,
  section: ExamSection,
  answers: SectionAnswers,
  isInterruption = false,
): Promise<SubmitSectionResponse> {
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
  return json as SubmitSectionResponse;
}

// Evaluate a writing submission
export async function evaluateWriting(
  sessionId: string,
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
    body: JSON.stringify({ session_id: sessionId }),
  });

  const json = await res.json();
  if (!res.ok) {
    return { rubric: FALLBACK_WRITING_RUBRIC, fallback: true };
  }
  if (!json?.rubric) {
    return { rubric: FALLBACK_WRITING_RUBRIC, fallback: true };
  }
  // Never throw — always return fallback payload when backend degrades.
  return json as { rubric: WritingRubric; fallback: boolean };
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
