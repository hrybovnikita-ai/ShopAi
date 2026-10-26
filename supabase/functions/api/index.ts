/**
 * ShopAi API service.
 *
 * A small dependency-free Deno server that fronts the Supabase stack:
 * administrator endpoints (authorized on the server against `admin_users`),
 * order creation, semantic search over pgvector embeddings, AI comparison and
 * the structured monitoring feed for the System Monitor page.
 */
import { env } from "./lib/env.ts";
import { HttpError, json, publicError } from "./lib/http.ts";
import { getAuthUser, isAdmin, type AuthUser } from "./lib/auth.ts";
import { logLine, recordError, recordRequest } from "./lib/monitoring.ts";
import type { RouteContext } from "./lib/types.ts";
import { ensureProductEmbeddings } from "./lib/embeddings.ts";
import {
  handleCompare,
  handleCreateOrder,
  handleHealth,
  handleSemanticSearch,
} from "./routes/public.ts";
import {
  handleCatalog,
  handleCatalogProduct,
  handleCatalogSuggest,
} from "./routes/catalog.ts";
import {
  handleAssistantChat,
  handleAssistantStatus,
} from "./routes/assistant.ts";
import {
  handleListReviews,
  handleModerateReview,
} from "./routes/reviews.ts";
import {
  handleAdminSession,
  handleAdminStats,
  handleCreateCategory,
  handleCreateProduct,
  handleDeleteCategory,
  handleDeleteProduct,
  handleEmbeddingBackfill,
  handleListCategories,
  handleListCustomers,
  handleListOrders,
  handleListProducts,
  handleMonitorErrors,
  handleMonitorOverview,
  handleMonitorRequests,
  handleUpdateCategory,
  handleUpdateOrderStatus,
  handleUpdateProduct,
} from "./routes/admin.ts";

type Access = "public" | "user" | "admin";
type Handler = (ctx: RouteContext) => Promise<Response>;

interface RouteDefinition {
  method: string;
  pattern: string;
  access: Access;
  handler: Handler;
}

interface CompiledRoute extends RouteDefinition {
  regex: RegExp;
  keys: string[];
}

const ROUTES: RouteDefinition[] = [
  { method: "GET", pattern: "/", access: "public", handler: handleHealth },
  { method: "GET", pattern: "/health", access: "public", handler: handleHealth },

  { method: "GET", pattern: "/catalog", access: "public", handler: handleCatalog },
  { method: "GET", pattern: "/catalog/suggest", access: "public", handler: handleCatalogSuggest },
  { method: "GET", pattern: "/catalog/:id", access: "public", handler: handleCatalogProduct },
  { method: "GET", pattern: "/assistant/status", access: "public", handler: handleAssistantStatus },
  { method: "POST", pattern: "/assistant/chat", access: "public", handler: handleAssistantChat },

  { method: "POST", pattern: "/search/semantic", access: "public", handler: handleSemanticSearch },
  { method: "POST", pattern: "/ai/compare", access: "public", handler: handleCompare },
  { method: "POST", pattern: "/orders", access: "public", handler: handleCreateOrder },

  { method: "GET", pattern: "/admin/reviews", access: "admin", handler: handleListReviews },
  { method: "PATCH", pattern: "/admin/reviews/:id", access: "admin", handler: handleModerateReview },

  { method: "GET", pattern: "/admin/session", access: "public", handler: handleAdminSession },
  { method: "GET", pattern: "/admin/stats", access: "admin", handler: handleAdminStats },

  { method: "GET", pattern: "/admin/products", access: "admin", handler: handleListProducts },
  { method: "POST", pattern: "/admin/products", access: "admin", handler: handleCreateProduct },
  { method: "PATCH", pattern: "/admin/products/:id", access: "admin", handler: handleUpdateProduct },
  { method: "DELETE", pattern: "/admin/products/:id", access: "admin", handler: handleDeleteProduct },

  { method: "GET", pattern: "/admin/categories", access: "admin", handler: handleListCategories },
  { method: "POST", pattern: "/admin/categories", access: "admin", handler: handleCreateCategory },
  { method: "PATCH", pattern: "/admin/categories/:id", access: "admin", handler: handleUpdateCategory },
  { method: "DELETE", pattern: "/admin/categories/:id", access: "admin", handler: handleDeleteCategory },

  { method: "GET", pattern: "/admin/orders", access: "admin", handler: handleListOrders },
  { method: "PATCH", pattern: "/admin/orders/:id", access: "admin", handler: handleUpdateOrderStatus },

  { method: "GET", pattern: "/admin/customers", access: "admin", handler: handleListCustomers },

  { method: "GET", pattern: "/admin/monitor/overview", access: "admin", handler: handleMonitorOverview },
  { method: "GET", pattern: "/admin/monitor/errors", access: "admin", handler: handleMonitorErrors },
  { method: "GET", pattern: "/admin/monitor/requests", access: "admin", handler: handleMonitorRequests },
  { method: "POST", pattern: "/admin/embeddings/backfill", access: "admin", handler: handleEmbeddingBackfill },
];

function compile(definition: RouteDefinition): CompiledRoute {
  const keys: string[] = [];
  const source = definition.pattern.replace(/:([A-Za-z_]+)/g, (_match, key: string) => {
    keys.push(key);
    return "([^/]+)";
  });
  return { ...definition, regex: new RegExp(`^${source}$`), keys };
}

const COMPILED = ROUTES.map(compile);

function normalizePath(pathname: string): string {
  const stripped = pathname.startsWith("/api") ? pathname.slice(4) : pathname;
  const trimmed = stripped.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

async function authorize(access: Access, user: AuthUser | null): Promise<void> {
  if (access === "public") return;
  if (!user) throw new HttpError(401, "Sign in to continue", "unauthenticated");
  if (access === "admin" && !(await isAdmin(user))) {
    throw new HttpError(403, "Administrator access required", "forbidden");
  }
}

async function dispatch(req: Request, url: URL, user: AuthUser | null): Promise<Response> {
  const path = normalizePath(url.pathname);
  const route = COMPILED.find((candidate) => candidate.method === req.method && candidate.regex.test(path));
  if (!route) throw new HttpError(404, "Endpoint not found", "not_found");

  const match = path.match(route.regex);
  const params: Record<string, string> = {};
  route.keys.forEach((key, index) => {
    params[key] = decodeURIComponent(match?.[index + 1] ?? "");
  });

  await authorize(route.access, user);
  return route.handler({ req, url, params, user });
}

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const started = performance.now();
  let user: AuthUser | null = null;
  let response: Response;

  try {
    user = await getAuthUser(req);
    response = await dispatch(req, url, user);
  } catch (error) {
    const failure = publicError(error);
    response = json(failure.body, failure.status);

    if (failure.status >= 500) {
      logLine("error", "Unhandled API error", { code: failure.body.code, path: normalizePath(url.pathname) });
    }
  }

  const durationMs = performance.now() - started;

  if (response.status >= 400 && response.status !== 401) {
    const body = await response.clone().json().catch(() => ({}));
    await recordError({
      level: response.status >= 500 ? "error" : "warning",
      message: String((body as { error?: string }).error ?? `HTTP ${response.status}`),
      code: (body as { code?: string }).code || undefined,
      path: normalizePath(url.pathname),
      method: req.method,
      status: response.status,
    });
  }

  await recordRequest({
    method: req.method,
    path: normalizePath(url.pathname),
    status: response.status,
    durationMs,
    user,
  });

  return response;
}

if (!env.serviceRoleKey) {
  logLine("error", "SUPABASE_SERVICE_ROLE_KEY is missing; the API cannot reach PostgREST");
}

Deno.serve({ port: env.port, hostname: "0.0.0.0" }, async (req) => {
  try {
    return await handle(req);
  } catch (error) {
    logLine("error", "Request failed before a response could be produced", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return json({ error: "Unexpected server error", code: "internal_error" }, 500);
  }
});

// Warm the vector index for the existing catalog (best effort).
ensureProductEmbeddings()
  .then(() => logLine("info", "Product embeddings are ready"))
  .catch((error) => logLine("warn", "Embedding warm-up skipped", {
    reason: error instanceof Error ? error.message : "unknown",
  }));
