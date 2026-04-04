const DEFAULT_ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type";

export function requireAllowedOrigin(
  getEnv: (name: string) => string | undefined = (name) => Deno.env.get(name),
): string {
  const allowedOrigin = getEnv("ALLOWED_ORIGIN")?.trim();
  if (!allowedOrigin) {
    throw new Error("ALLOWED_ORIGIN is not set");
  }
  return allowedOrigin;
}

export function buildCorsHeaders(
  requestOrigin: string | null,
  allowedOrigin: string,
  allowedHeaders = DEFAULT_ALLOWED_HEADERS,
): Record<string, string> | null {
  if (requestOrigin && requestOrigin !== allowedOrigin) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
