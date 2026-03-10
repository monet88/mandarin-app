/**
 * RevenueCat Webhook Handler
 *
 * Receives RevenueCat server events, validates authenticity via shared secret,
 * upserts subscription records idempotently, and mirrors premium status to profiles.
 *
 * Security: caller must supply Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>
 * Never trusts client-side purchase claims — this is the authoritative path.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  corsPreflightResponse,
  jsonResponse,
  errorResponse,
} from "../_shared/hsk-events.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RcEventBody {
  event: RcEvent;
}

interface RcEvent {
  id: string;                        // RevenueCat event UUID — idempotency key
  type: string;                      // e.g. INITIAL_PURCHASE, RENEWAL, CANCELLATION …
  app_user_id: string;               // RevenueCat App User ID (equals Supabase user id)
  product_id: string;
  entitlement_ids: string[];
  purchase_date_ms?: number;
  expiration_at_ms?: number | null;
  cancelled_at_ms?: number | null;
  store?: string;
  environment?: string;
}

// RevenueCat event types that mean the subscription is active
const ACTIVE_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "UNCANCELLATION",
  "PRODUCT_CHANGE",
  "TRANSFER",
  "SUBSCRIBER_ALIAS",
]);

// Event types that revoke entitlement
const REVOKE_EVENT_TYPES = new Set([
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "REFUND",
]);

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  // ── 1. Authenticate webhook request ──────────────────────────────────────
  const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return errorResponse("Webhook secret not configured", 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token || token !== webhookSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  let body: RcEventBody;
  try {
    body = await req.json() as RcEventBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const event = body?.event;
  if (!event?.id || !event?.app_user_id || !event?.type) {
    return jsonResponse({ error: "Missing required event fields" }, 400);
  }

  // ── 3. Resolve Supabase user from RevenueCat App User ID ──────────────────
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceKey);

  // app_user_id is set to the Supabase UUID at login time in billing.ts identifyUser()
  const userId = event.app_user_id;

  // Verify user exists
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, is_premium, premium_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    // User not found — could be a test event or a race; return 200 to stop RC retries
    console.warn("[revenuecat-webhook] User not found:", userId);
    return jsonResponse({ ok: true, skipped: "user_not_found" });
  }

  // ── 4. Idempotency: skip if event already processed ──────────────────────
  const { data: existing } = await adminClient
    .from("subscriptions")
    .select("id")
    .eq("rc_event_id", event.id)
    .maybeSingle();

  if (existing) {
    return jsonResponse({ ok: true, skipped: "duplicate_event" });
  }

  // ── 5. Map event to subscription status ──────────────────────────────────
  const isActive = ACTIVE_EVENT_TYPES.has(event.type);
  const isRevoke = REVOKE_EVENT_TYPES.has(event.type);

  let status: string;
  if (isActive) status = "active";
  else if (event.type === "REFUND") status = "refunded";
  else if (event.type === "CANCELLATION") status = "cancelled";
  else status = "expired";

  const entitlementId = event.entitlement_ids?.[0] ?? "premium";
  const purchaseDate = event.purchase_date_ms
    ? new Date(event.purchase_date_ms).toISOString()
    : null;
  const expirationDate = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;
  const cancelledAt = event.cancelled_at_ms
    ? new Date(event.cancelled_at_ms).toISOString()
    : null;

  // ── 6. Insert subscription record ────────────────────────────────────────
  const { error: insertError } = await adminClient.from("subscriptions").insert({
    user_id: userId,
    rc_original_app_user_id: event.app_user_id,
    rc_event_id: event.id,
    product_id: event.product_id,
    entitlement_id: entitlementId,
    status,
    purchase_date: purchaseDate,
    expiration_date: expirationDate,
    cancelled_at: cancelledAt,
    store: event.store ?? null,
    environment: event.environment ?? null,
    raw_event: event as unknown as Record<string, unknown>,
  });

  if (insertError) {
    console.error("[revenuecat-webhook] Insert error:", insertError.message);
    return errorResponse("Failed to record subscription", 500);
  }

  // ── 7. Mirror to profiles.is_premium (summary field) ─────────────────────
  // Precedence: RevenueCat entitlement overrides legacy trial flag.
  // Only update when the new event changes premium status.
  const shouldBePremium = isActive;
  const profileNeedsUpdate =
    shouldBePremium !== !!profile.is_premium ||
    (isRevoke && profile.is_premium);

  if (profileNeedsUpdate) {
    const profilePatch: Record<string, unknown> = {
      is_premium: shouldBePremium,
      updated_at: new Date().toISOString(),
    };

    if (shouldBePremium && expirationDate) {
      profilePatch.premium_expires_at = expirationDate;
    } else if (!shouldBePremium) {
      profilePatch.premium_expires_at = null;
    }

    const { error: updateError } = await adminClient
      .from("profiles")
      .update(profilePatch)
      .eq("id", userId);

    if (updateError) {
      console.error("[revenuecat-webhook] Profile update error:", updateError.message);
      // Non-fatal: subscription record is already saved; profile can be reconciled later
    }
  }

  return jsonResponse({ ok: true });
});
