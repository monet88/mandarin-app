/**
 * hsk-session.ts
 * Client-side types and API caller for the hsk-session-init Edge Function.
 * All quota/premium state is server-authoritative — never derive from client.
 */

import { supabase } from "@/utils/supabase";

// ── Response types ────────────────────────────────────────────────────────

export interface HskProgressRow {
  hsk_level: number;
  words_learned: number;
  words_mastered: number;
  last_studied_at: string | null;
}

export interface HskSessionData {
  user_id: string;
  server_time: string;
  premium: {
    is_premium: boolean;
    expires_at: string | null;
  };
  quota: {
    daily_exam_limit: number | null;
    exams_used_today: number;
    exams_remaining_today: number | null;
    quota_resets_at: string;
  };
  progress: HskProgressRow[];
}

// ── API call ──────────────────────────────────────────────────────────────

/**
 * Fetches server-authoritative session state from hsk-session-init.
 * Returns null on auth/network errors — callers must handle gracefully.
 */
export async function fetchHskSession(): Promise<HskSessionData | null> {
  try {
    const { data, error } = await supabase.functions.invoke("hsk-session-init");
    if (error) {
      console.warn("[hsk-session] invoke error:", error.message);
      return null;
    }
    return data as HskSessionData;
  } catch (err) {
    console.warn("[hsk-session] unexpected error:", err);
    return null;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns the progress row for a given level, or undefined if none. */
export function getProgressForLevel(
  session: HskSessionData,
  level: number,
): HskProgressRow | undefined {
  return session.progress.find((r) => r.hsk_level === level);
}

/** True if free user has exhausted today's exam quota. */
export function isExamQuotaExhausted(session: HskSessionData): boolean {
  if (session.premium.is_premium) return false;
  return (session.quota.exams_remaining_today ?? 0) <= 0;
}
