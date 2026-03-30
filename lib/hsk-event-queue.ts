/**
 * hsk-event-queue.ts
 * Offline-first event queue for HSK word mastery and review updates.
 * Events are persisted locally and flushed to Supabase when online.
 * Deduplication by event_id prevents double-writes on retry.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReviewQuality } from "@/lib/hsk-review";
import { supabase } from "@/utils/supabase";

// ── Types ─────────────────────────────────────────────────────────────────

export type HskEventType = "word_reviewed";

interface HskReviewPayload {
  word_id: string;
  word_simplified: string;
  mastery_delta: -1 | 0 | 1 | 2;
  quality: ReviewQuality;
  interval: number;
}

export interface HskQueueEvent {
  /** UUID — dedup key on server */
  event_id: string;
  event_type: HskEventType;
  hsk_level: number;
  occurred_at: string;
  payload: HskReviewPayload;
  /** Retry count — removed from payload before sending */
  _retries: number;
}

interface SyncResponse {
  errors?: Array<{ index: number; error: string }>;
}

// ── Storage ───────────────────────────────────────────────────────────────

const QUEUE_KEY = "hsk_event_queue_v1";
const MAX_BATCH_SIZE = 50;

async function readQueue(): Promise<HskQueueEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HskQueueEvent[];
  } catch {
    return [];
  }
}

async function writeQueue(events: HskQueueEvent[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(events));
}

// ── UUID helper (no dependency) ───────────────────────────────────────────

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function qualityToMasteryDelta(quality: ReviewQuality): -1 | 0 | 1 | 2 {
  switch (quality) {
    case 0:
      return -1;
    case 1:
      return 0;
    case 2:
      return 1;
    case 3:
    default:
      return 2;
  }
}

// ── Mutex (serialises read→push→write to prevent race conditions) ────────

let _mutex: Promise<void> = Promise.resolve();
function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  const result = _mutex.then(fn);
  _mutex = result.then(() => {}, () => {});
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────

/** Enqueues a review event. Returns immediately — no network call. */
export async function enqueueReviewEvent(
  word_id: string,
  word_simplified: string,
  hsk_level: number,
  quality: ReviewQuality,
  interval: number,
): Promise<void> {
  return withMutex(async () => {
    const queue = await readQueue();
    queue.push({
      event_id: uuid(),
      event_type: "word_reviewed",
      hsk_level,
      occurred_at: new Date().toISOString(),
      payload: {
        word_id,
        word_simplified,
        mastery_delta: qualityToMasteryDelta(quality),
        quality,
        interval,
      },
      _retries: 0,
    });
    await writeQueue(queue);
  });
}

/** Returns count of pending events (for optional sync health display). */
export async function getPendingCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}

/**
 * Flushes pending events through the supported hsk-sync-events ingest path.
 * Removes successfully sent events; increments retry counter on failure.
 * Max 3 retries before an event is dropped to prevent indefinite growth.
 */
export async function flushEventQueue(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const failed: HskQueueEvent[] = [];

  for (let offset = 0; offset < queue.length; offset += MAX_BATCH_SIZE) {
    const batch = queue.slice(offset, offset + MAX_BATCH_SIZE);
    try {
      const payload = batch.map(({ _retries, ...event }) => event);
      const { data, error } = await supabase.functions.invoke("hsk-sync-events", {
        body: { events: payload },
      });

      if (error) throw error;
      const response = data as SyncResponse | null;
      const invalidIndexes = new Set(
        (response?.errors ?? []).map((entry) => entry.index),
      );

      for (const [index, event] of batch.entries()) {
        if (!invalidIndexes.has(index)) continue;
        if (event._retries < 3) {
          failed.push({ ...event, _retries: event._retries + 1 });
        }
      }
    } catch (error) {
      console.warn("[hsk-event-queue] Flush failed:", error);
      for (const event of batch) {
        if (event._retries < 3) {
          failed.push({ ...event, _retries: event._retries + 1 });
        }
      }
    }
  }

  await writeQueue(failed);
}
