/**
 * RevenueCat billing integration.
 * Wraps react-native-purchases SDK for purchase, restore, and entitlement checks.
 *
 * Entitlement precedence:
 *   1. RevenueCat active entitlement (source of truth going forward)
 *   2. Legacy profiles.is_premium + premium_expires_at (honoured during transition window)
 *
 * Never trust client purchase success alone — webhook is authoritative for Supabase records.
 */

import Purchases, {
  CustomerInfo,
  PurchasesError,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// Product / entitlement identifiers
// ---------------------------------------------------------------------------

const ENTITLEMENT_PREMIUM = "premium";

// Separate keys for iOS and Android
const RC_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "",
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "",
  default: "",
});

// RevenueCat Offering identifier
export const OFFERING_DEFAULT = "default";

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

let _initialised = false;

/**
 * Call once at app startup (after auth is resolved so userId is available).
 * Safe to call multiple times — no-ops after first successful init.
 */
export async function initRevenueCat(userId?: string): Promise<void> {
  if (_initialised) return;
  if (!RC_API_KEY) {
    console.warn("[billing] RevenueCat API key not set — billing disabled");
    return;
  }
  Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId ?? null });
  _initialised = true;
}

/** Set or change the RevenueCat App User ID (call after sign-in or sign-out). */
export async function identifyUser(userId: string): Promise<void> {
  if (!_initialised) return;
  await Purchases.logIn(userId);
}

/** Reset to anonymous ID (call on sign-out). */
export async function resetUser(): Promise<void> {
  if (!_initialised) return;
  await Purchases.logOut();
}

// ---------------------------------------------------------------------------
// Entitlement helpers
// ---------------------------------------------------------------------------

/** Returns true when the RevenueCat "premium" entitlement is active. */
export function hasPremiumEntitlement(info: CustomerInfo): boolean {
  return !!info.entitlements.active[ENTITLEMENT_PREMIUM];
}

/** Fetches latest CustomerInfo from RevenueCat. */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!_initialised) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Purchase flow
// ---------------------------------------------------------------------------

export interface PurchaseResult {
  success: boolean;
  isPremium: boolean;
  /** Set on user cancellation. */
  cancelled?: boolean;
  error?: string;
}

/**
 * Initiate a subscription purchase for the given package identifier.
 * The store transaction is recorded on RevenueCat; the webhook syncs to Supabase.
 */
export async function purchasePackage(
  rcPackageIdentifier: string,
): Promise<PurchaseResult> {
  if (!_initialised) {
    return { success: false, isPremium: false, error: "Billing not initialised" };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) {
      return { success: false, isPremium: false, error: "No offerings available" };
    }

    const pkg = current.availablePackages.find(
      (p) => p.identifier === rcPackageIdentifier,
    );
    if (!pkg) {
      return { success: false, isPremium: false, error: `Package not found: ${rcPackageIdentifier}` };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return {
      success: true,
      isPremium: hasPremiumEntitlement(customerInfo),
    };
  } catch (err) {
    const rcErr = err as PurchasesError;
    if (rcErr.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, isPremium: false, cancelled: true };
    }
    const message = rcErr.message ?? "Purchase failed";
    return { success: false, isPremium: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------

export interface RestoreResult {
  isPremium: boolean;
  error?: string;
}

/** Restore previous purchases (required for App Store compliance). */
export async function restorePurchases(): Promise<RestoreResult> {
  if (!_initialised) {
    return { isPremium: false, error: "Billing not initialised" };
  }
  try {
    const info = await Purchases.restorePurchases();
    return { isPremium: hasPremiumEntitlement(info) };
  } catch (err) {
    const message = (err as Error).message ?? "Restore failed";
    return { isPremium: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Offerings (for UI display)
// ---------------------------------------------------------------------------

export interface OfferingPackage {
  identifier: string;
  productIdentifier: string;
  priceString: string;
  title: string;
}

export async function fetchOfferings(): Promise<OfferingPackage[]> {
  if (!_initialised) return [];
  try {
    const offerings = await Purchases.getOfferings();
    return (offerings.current?.availablePackages ?? []).map((p) => ({
      identifier: p.identifier,
      productIdentifier: p.product.identifier,
      priceString: p.product.priceString,
      title: p.product.title,
    }));
  } catch {
    return [];
  }
}
