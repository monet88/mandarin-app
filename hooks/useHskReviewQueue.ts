/**
 * useHskReviewQueue.ts
 * Hook that loads due review words for a level and triggers queue flush
 * on screen focus. Keeps offline review UX snappy — no waiting for network.
 */

import { flushEventQueue, enqueueReviewEvent } from "@/lib/hsk-event-queue";
import { getLevelProgress, saveWordState } from "@/lib/hsk-progress";
import { applyReview, getDueWords, newReviewState, ReviewQuality, WordReviewState } from "@/lib/hsk-review";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

interface UseHskReviewQueueResult {
  dueStates: WordReviewState[];
  loading: boolean;
  /** Call after user rates a card. Updates local state + enqueues sync event. */
  submitReview: (
    word_id: string,
    word_simplified: string,
    quality: ReviewQuality,
    level: number,
  ) => Promise<void>;
  /** Reload due list (e.g. after finishing a session). */
  refresh: (level: number) => Promise<void>;
}

export function useHskReviewQueue(level: number): UseHskReviewQueueResult {
  const [dueStates, setDueStates] = useState<WordReviewState[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  const refresh = useCallback(async (lvl: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const map = await getLevelProgress(lvl);
      const due = getDueWords(Object.values(map));
      setDueStates(due);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Flush queue silently on focus — fire-and-forget
      void flushEventQueue();
      void refresh(level);
    }, [level, refresh]),
  );

  const submitReview = useCallback(
    async (
      word_id: string,
      word_simplified: string,
      quality: ReviewQuality,
      lvl: number,
    ) => {
      const map = await getLevelProgress(lvl);
      const currentState = map[word_id] ?? newReviewState(word_id);
      const nextState = applyReview(currentState, quality);

      // Persist locally first (offline-safe)
      await saveWordState(lvl, nextState);
      // Enqueue sync event (flushed in background on next focus)
      await enqueueReviewEvent(
        word_id,
        word_simplified,
        lvl,
        quality,
        nextState.interval,
      );

      // Optimistically remove from due list
      setDueStates((prev) => prev.filter((s) => s.word_id !== word_id));
    },
    [],
  );

  return { dueStates, loading, submitReview, refresh };
}
