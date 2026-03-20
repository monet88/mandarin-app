import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  type HskClientEvent,
  corsPreflightResponse,
  errorResponse,
  jsonResponse,
  unauthorizedResponse,
  validateClientEvent,
} from "../_shared/hsk-events.ts";

const MAX_BATCH_SIZE = 50;

// Accept batched events, deduplicate on event_id, recompute aggregates
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

    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.events)) {
      return jsonResponse({ error: "Body must be { events: HskClientEvent[] }" }, 400);
    }

    const rawEvents: unknown[] = body.events.slice(0, MAX_BATCH_SIZE);

    // Validate all events before touching the DB
    const validationErrors: { index: number; error: string }[] = [];
    const validEvents: HskClientEvent[] = [];

    for (let i = 0; i < rawEvents.length; i++) {
      const result = validateClientEvent(rawEvents[i]);
      if (!result.valid) {
        validationErrors.push({ index: i, error: result.error! });
      } else {
        validEvents.push(rawEvents[i] as HskClientEvent);
      }
    }

    if (validEvents.length === 0) {
      return jsonResponse({ accepted: 0, skipped: 0, errors: validationErrors }, 207);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const serverNow = new Date().toISOString();

    // Upsert into event ledger — conflict on event_id updates processed_at but leaves processed flag unchanged.
    // This ensures partial failures are replayable: unprocessed ledger rows get retried.
    const ledgerRows = validEvents.map((ev) => ({
      event_id: ev.event_id,
      user_id: user.id,
      event_type: ev.event_type,
      payload: ev.payload,
      hsk_level: ev.hsk_level ?? null,
      occurred_at: ev.occurred_at,
      processed_at: serverNow,
      processed: false,
    }));

    const { error: ledgerError } = await adminClient
      .from("hsk_event_ledger")
      .upsert(ledgerRows, { onConflict: "event_id" })
      .select("event_id");

    if (ledgerError) throw ledgerError;

    // Fetch all unprocessed events for this user (includes retried partial failures)
    const { data: unprocessedEvents, error: fetchErr } = await adminClient
      .from("hsk_event_ledger")
      .select("event_id, event_type, hsk_level, payload")
      .eq("user_id", user.id)
      .eq("processed", false);

    if (fetchErr) throw fetchErr;

    const newEvents = unprocessedEvents ?? [];

    // Apply mastery updates first so progress in the same response is fresh.
    const affectedLevels = new Set<number>();
    const reviewEvents = newEvents.filter((e) => e.event_type === "word_reviewed");
    for (const ev of reviewEvents) {
      if (ev.hsk_level) affectedLevels.add(ev.hsk_level);
      const payload = ev.payload as {
        word_simplified?: string;
        mastery_delta?: number;
        time_spent_seconds?: number;
      };
      if (payload.word_simplified && ev.hsk_level) {
        await upsertWordMastery(
          adminClient,
          user.id,
          payload.word_simplified,
          ev.hsk_level,
          payload.mastery_delta ?? 0,
        );
      }
    }

    // Include non-review events that still touch a level and recompute once at end.
    for (const ev of newEvents) {
      if (ev.hsk_level) affectedLevels.add(ev.hsk_level);
    }
    for (const level of affectedLevels) {
      await recomputeProgress(adminClient, user.id, level);
    }

    // Mark processed events
    const processedIds = newEvents.map((e) => e.event_id);
    if (processedIds.length > 0) {
      await adminClient
        .from("hsk_event_ledger")
        .update({ processed: true })
        .eq("user_id", user.id)
        .in("event_id", processedIds);
    }

    return jsonResponse({
      accepted: newEvents.length,
      skipped: validEvents.length - newEvents.length,
      errors: validationErrors,
      sync_receipt: {
        processed_at: serverNow,
        event_ids: processedIds,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(msg);
  }
});

// Recompute hsk_progress aggregate from canonical word mastery rows
async function recomputeProgress(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  userId: string,
  hskLevel: number,
): Promise<void> {
  const { data: masteryRows } = await adminClient
    .from("hsk_word_mastery")
    .select("mastery_score")
    .eq("user_id", userId)
    .eq("hsk_level", hskLevel);

  if (!masteryRows) return;

  const wordsLearned = masteryRows.filter((r: { mastery_score: number }) => r.mastery_score >= 1).length;
  const wordsMastered = masteryRows.filter((r: { mastery_score: number }) => r.mastery_score >= 4).length;

  await adminClient.from("hsk_progress").upsert(
    {
      user_id: userId,
      hsk_level: hskLevel,
      words_learned: wordsLearned,
      words_mastered: wordsMastered,
      last_studied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,hsk_level" },
  );
}

// Atomic word mastery upsert via Postgres function (eliminates read-then-write race)
async function upsertWordMastery(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  userId: string,
  wordSimplified: string,
  hskLevel: number,
  masteryDelta: number,
): Promise<void> {
  const { error } = await adminClient.rpc("upsert_word_mastery", {
    p_user_id: userId,
    p_word_simplified: wordSimplified,
    p_hsk_level: hskLevel,
    p_mastery_delta: masteryDelta,
  });
  if (error) throw error;
}
