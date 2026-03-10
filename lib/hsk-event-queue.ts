/**
 * hsk-event-queue.ts
 * Offline-first event queue for HSK word mastery and review updates.
 * Events are persisted locally and flushed to Supabase when online.
 * Deduplication by event_id prevents double-writes on retry.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/utils/supabase";

// ── Types ─────────────────────────────────────────────────────────────────

export type HskEventType = "word_reviewed" | "word_mastered";

export interface HskQueueEvent {
  /** UUID — dedup key on server */
  event_id: string;
  type: HskEventType;
  word_id: string;
  hsk_level: number;
  /** SM-2 quality rating (0-3) for word_reviewed events */
  quality?: number;
  /** New interval in days after review */
  interval?: number;
  occurred_at: string;
  /** Retry count — removed from payload before sending */
  _retries: number;
}

// ── Storage ───────────────────────────────────────────────────────────────

const QUEUE_KEY = "hsk_event_queue_v1";

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

// ── Public API ────────────────────────────────────────────────────────────

/** Enqueues a review event. Returns immediately — no network call. */
export async function enqueueReviewEvent(
  word_id: string,
  hsk_level: number,
  quality: number,
  interval: number,
): Promise<void> {
  const queue = await readQueue();
  queue.push({
    event_id: uuid(),
    type: "word_reviewed",
    word_id,
    hsk_level,
    quality,
    interval,
    occurred_at: new Date().toISOString(),
    _retries: 0,
  });
  await writeQueue(queue);
}

/** Returns count of pending events (for optional sync health display). */
export async function getPendingCount(): Promise<number> {
  const queue = await readQueue();
  return queue.length;
}

/**
 * Flushes pending events to Supabase hsk_review_events table.
 * Removes successfully sent events; increments retry counter on failure.
 * Max 3 retries before an event is dropped to prevent indefinite growth.
 */
export async function flushEventQueue(): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const failed: HskQueueEvent[] = [];

  for (const event of queue) {
    const { _retries, ...payload } = event;
    try {
      const { error } = await supabase
        .from("hsk_review_events")
        .upsert(payload, { onConflict: "event_id", ignoreDuplicates: true });

      if (error) throw error;
      // Successfully sent — drop from queue (do not push to failed)
    } catch {
      if (_retries < 3) {
        failed.push({ ...event, _retries: _retries + 1 });
      }
      // else: silently drop after 3 retries
    }
  }

  await writeQueue(failed);
}
