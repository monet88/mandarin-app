// Shared HSK event type definitions, validation helpers, and constants

export const HSK_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export type HskLevel = (typeof HSK_LEVELS)[number];

export const HSK_EVENT_TYPES = [
  "word_reviewed",
  "lesson_completed",
  "exam_submitted",
  "vocab_practiced",
] as const;
export type HskEventType = (typeof HSK_EVENT_TYPES)[number];

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Raw event shape sent by client in a batch
export interface HskClientEvent {
  event_id: string;           // client-generated UUID for idempotency
  event_type: HskEventType;
  hsk_level?: HskLevel;
  occurred_at: string;        // ISO8601 — informational only, not trusted for quota
  payload: Record<string, unknown>;
}

// Word-reviewed payload
export interface WordReviewedPayload {
  word_simplified: string;
  mastery_delta: number;  // -1 | 0 | 1 | 2
  time_spent_seconds?: number;
}

// Lesson-completed payload
export interface LessonCompletedPayload {
  lesson_id: string;
  score?: number;
  time_spent_seconds?: number;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateHskLevel(level: unknown): level is HskLevel {
  return HSK_LEVELS.includes(level as HskLevel);
}

export function validateEventType(type: unknown): type is HskEventType {
  return HSK_EVENT_TYPES.includes(type as HskEventType);
}

export function validateClientEvent(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== "object") {
    return { valid: false, error: "Event must be an object" };
  }
  const ev = raw as Record<string, unknown>;

  if (!ev.event_id || typeof ev.event_id !== "string") {
    return { valid: false, error: "event_id must be a non-empty string" };
  }
  if (!validateEventType(ev.event_type)) {
    return { valid: false, error: `Invalid event_type: ${ev.event_type}` };
  }
  if (ev.hsk_level !== undefined && !validateHskLevel(ev.hsk_level)) {
    return { valid: false, error: `hsk_level must be 1–6` };
  }
  if (!ev.occurred_at || typeof ev.occurred_at !== "string") {
    return { valid: false, error: "occurred_at must be an ISO8601 string" };
  }
  if (!ev.payload || typeof ev.payload !== "object") {
    return { valid: false, error: "payload must be an object" };
  }
  return { valid: true };
}

export function jsonResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

export function corsPreflightResponse(): Response {
  return new Response("ok", { headers: CORS_HEADERS });
}

export function unauthorizedResponse(message = "Unauthorized"): Response {
  return jsonResponse({ error: message }, 401);
}

export function forbiddenResponse(message = "Forbidden"): Response {
  return jsonResponse({ error: message }, 403);
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, status);
}

// Check premium status from profile row
export function isPremiumActive(profile: {
  is_premium: boolean | null;
  premium_expires_at: string | null;
} | null): boolean {
  if (!profile?.is_premium) return false;
  if (!profile.premium_expires_at) return true;
  return new Date(profile.premium_expires_at) > new Date();
}
