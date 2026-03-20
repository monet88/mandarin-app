import { AuthContext } from "@/ctx/AuthContext";
import {
  initRevenueCat,
  identifyUser,
  resetUser,
  getCustomerInfo,
  hasPremiumEntitlement,
} from "@/lib/billing";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { AppState, AppStateStatus } from "react-native";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  // RevenueCat entitlement overrides legacy profile flag when present
  const [rcIsPremium, setRcIsPremium] = useState<boolean | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Precedence: RevenueCat (rcIsPremium) > legacy profile flag
  const legacyPremiumActive =
    !!profile?.is_premium &&
    (!profile?.premium_expires_at ||
      new Date(profile.premium_expires_at) > new Date());
  const isPremium = rcIsPremium !== null ? rcIsPremium : legacyPremiumActive;

  const premiumExpiresAt: string | null = profile?.premium_expires_at ?? null;

  const loadProfile = async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      return;
    }
    const { error, data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", s.user.id)
      .maybeSingle();
    setProfile(error ? null : data);
  };

  const refreshProfile = () => loadProfile(session);

  /** Fetch latest RevenueCat entitlement and update local state. */
  const refreshRcEntitlement = async () => {
    const info = await getCustomerInfo();
    if (info !== null) {
      setRcIsPremium(hasPremiumEntitlement(info));
    }
  };

  // Init RevenueCat and identify user once session is known
  const setupRevenueCat = async (s: Session | null) => {
    if (!s) {
      await resetUser();
      setRcIsPremium(null);
      return;
    }
    await initRevenueCat(s.user.id);
    await identifyUser(s.user.id);
    await refreshRcEntitlement();
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const initialSession = data.session ?? null;
      setSession(initialSession);
      await Promise.all([
        loadProfile(initialSession),
        setupRevenueCat(initialSession),
      ]);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setLoading(true);
      setSession(newSession);
      Promise.all([
        loadProfile(newSession),
        setupRevenueCat(newSession),
      ]).finally(() => setLoading(false));
    });

    // Refresh RevenueCat entitlement when app returns to foreground
    const appStateSub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          refreshRcEntitlement();
        }
        appState.current = nextState;
      },
    );

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin: false,
        isPremium,
        premiumExpiresAt,
        refreshProfile,
        refreshRcEntitlement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
