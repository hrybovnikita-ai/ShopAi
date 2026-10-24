/**
 * ShopAi API service configuration.
 *
 * Runs inside the compose network next to PostgREST and Postgres. The service
 * role key stays server-side only: the browser never receives it.
 */
export const env = {
  port: Number(Deno.env.get("PORT") ?? "8001"),
  /** Internal PostgREST endpoint (no public exposure). */
  restUrl: Deno.env.get("SUPABASE_REST_URL") ?? "http://rest:3000",
  serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  /** Shared GoTrue secret used to verify user access tokens locally. */
  jwtSecret: Deno.env.get("SUPABASE_JWT_SECRET") ?? "",
  openaiKey: Deno.env.get("OPENAI_API_KEY") ?? "",
  openaiModel: Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini",
  openaiEmbeddingModel: Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small",
  environment: Deno.env.get("APP_ENV") ?? "development",
};

export const STARTED_AT = Date.now();
