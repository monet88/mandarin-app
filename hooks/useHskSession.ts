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
  refresh: () => Promise<void>;
}

export function useHskSession(): UseHskSessionResult {
  const [session, setSession] = useState<HskSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Prevent double-fetch on fast navigation
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(false);

    const data = await fetchHskSession();
    if (data) {
      setSession(data);
    } else {
      setError(true);
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

  return { session, loading, error, refresh };
}
