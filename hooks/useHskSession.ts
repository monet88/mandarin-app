/**
 * useHskSession.ts
 * React hook for fetching and caching server-authoritative HSK session state.
 * Refreshes on screen focus. Exposes loading/error states for graceful degradation.
 */

import { fetchHskSession, HskSessionData } from "@/lib/hsk-session";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

interface UseHskSessionResult {
  session: HskSessionData | null;
  loading: boolean;
  error: boolean;
  stale: boolean;
  refresh: () => Promise<void>;
}

export function useHskSession(): UseHskSessionResult {
  const [session, setSession] = useState<HskSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stale, setStale] = useState(false);
  // Prevent double-fetch on fast navigation
  const fetchingRef = useRef(false);
  const sessionRef = useRef<HskSessionData | null>(null);

  sessionRef.current = session;

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(false);

    const data = await fetchHskSession();
    if (data) {
      setSession(data);
      setStale(false);
    } else {
      setError(true);
      // Keep prior session for rendering, but mark it stale to block gated actions.
      setStale(sessionRef.current !== null);
    }
    setLoading(false);
    fetchingRef.current = false;
  }, []);

  // Fetch on every screen focus (tab switch, back navigation)
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { session, loading, error, stale, refresh };
}
