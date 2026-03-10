import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  corsPreflightResponse,
  errorResponse,
  FREE_DAILY_EXAM_QUOTA,
  isPremiumActive,
  jsonResponse,
  unauthorizedResponse,
} from "../_shared/hsk-events.ts";

// Returns quota state, premium state, and reset timestamps — all server-authoritative
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return unauthorizedResponse();

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return unauthorizedResponse();

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch profile for premium check (server reads — never trust client claim)
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    const premium = isPremiumActive(profile);

    // Count exams taken today (UTC day boundary, server-computed)
    const todayUtc = new Date();
    todayUtc.setUTCHours(0, 0, 0, 0);

    const { count: examsToday } = await adminClient
      .from("hsk_exam_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", todayUtc.toISOString());

    const usedToday = examsToday ?? 0;

    // Quota reset time: next UTC midnight
    const resetAt = new Date(todayUtc);
    resetAt.setUTCDate(resetAt.getUTCDate() + 1);

    // Fetch latest hsk_progress rows for the user
    const { data: progressRows } = await adminClient
      .from("hsk_progress")
      .select("hsk_level, words_learned, words_mastered, last_studied_at")
      .eq("user_id", user.id)
      .order("hsk_level");

    return jsonResponse({
      user_id: user.id,
      server_time: new Date().toISOString(),
      premium: {
        is_premium: premium,
        expires_at: profile?.premium_expires_at ?? null,
      },
      quota: {
        daily_exam_limit: premium ? null : FREE_DAILY_EXAM_QUOTA,
        exams_used_today: usedToday,
        exams_remaining_today: premium
          ? null
          : Math.max(0, FREE_DAILY_EXAM_QUOTA - usedToday),
        quota_resets_at: resetAt.toISOString(),
      },
      progress: progressRows ?? [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(msg);
  }
});
