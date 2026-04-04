import { assertEquals, assertThrows } from "jsr:@std/assert";

import { buildCorsHeaders, requireAllowedOrigin } from "./cors.ts";

Deno.test("requireAllowedOrigin throws when ALLOWED_ORIGIN is unset", () => {
  assertThrows(
    () => requireAllowedOrigin(() => undefined),
    Error,
    "ALLOWED_ORIGIN is not set",
  );
});

Deno.test("buildCorsHeaders allows the configured origin", () => {
  const headers = buildCorsHeaders(
    "https://app.example.com",
    "https://app.example.com",
  );

  assertEquals(headers?.["Access-Control-Allow-Origin"], "https://app.example.com");
  assertEquals(headers?.["Vary"], "Origin");
});

Deno.test("buildCorsHeaders rejects a mismatched origin", () => {
  const headers = buildCorsHeaders(
    "https://evil.example.com",
    "https://app.example.com",
  );

  assertEquals(headers, null);
});

Deno.test("buildCorsHeaders still returns restrictive headers when origin is absent", () => {
  const headers = buildCorsHeaders(null, "https://app.example.com");

  assertEquals(headers?.["Access-Control-Allow-Origin"], "https://app.example.com");
});
