/**
 * start-trial Edge Function
 *
 * DEPRECATED PATH: This function grants a 7-day trial via direct profile mutation.
 * It remains active for legacy users and manual QA flows but is superseded by
 * RevenueCat store billing for all new subscriptions.
 *
 * Precedence rule: If the user already has an active RevenueCat subscription record
 * (subscriptions table, status = 'active'), this function is a no-op to prevent
 * overwriting authoritative billing state with a weaker trial flag.
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // ── Precedence guard ────────────────────────────────────────────────────
    // If user has an active RevenueCat-backed subscription, do not overwrite
    // it with a weaker trial flag. RevenueCat is the source of truth.
    const { data: activeSub } = await adminClient
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (activeSub) {
      return new Response(
        JSON.stringify({
          ok: true,
          skipped: true,
          reason: "Active RevenueCat subscription found; trial grant skipped.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Fix #9: Prevent repeatable trial abuse ──────────────────────────────
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("trial_started_at")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile?.trial_started_at) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Trial already used",
          reason: "You have already used your free trial.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Legacy trial grant ──────────────────────────────────────────────────
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: updateError } = await adminClient.from("profiles").upsert({
      id: user.id,
      is_premium: true,
      premium_expires_at: expiresAt,
      trial_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ ok: true, premium_expires_at: expiresAt }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
