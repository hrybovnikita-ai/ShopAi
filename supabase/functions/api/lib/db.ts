/**
 * Minimal PostgREST client. The API talks to PostgREST with the service role
 * key, so RLS is bypassed here on purpose: every caller of these helpers has
 * already been authorized by the API (administrator check or public route).
 */
import { env } from "./env.ts";
import { HttpError } from "./http.ts";

type FilterValue = string | string[] | null | undefined;
export type Filters = Record<string, FilterValue>;

function baseHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: env.serviceRoleKey,
    authorization: `Bearer ${env.serviceRoleKey}`,
    "content-type": "application/json",
    ...extra,
  };
}

function buildUrl(table: string, filters: Filters): URL {
  const url = new URL(`${env.restUrl}/${table}`);
  for (const [key, value] of Object.entries(filters)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

async function request(url: URL, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new HttpError(503, "The database is unreachable", "database_unavailable");
  }
}

async function raiseForStatus(res: Response): Promise<never> {
  let message = `Database request failed (${res.status})`;
  let code = "database_error";
  try {
    const body = await res.json();
    message = body?.message ?? body?.hint ?? message;
    code = body?.code ?? code;
  } catch {
    // keep the defaults
  }
  const status = res.status === 404 ? 404 : res.status === 401 || res.status === 403 ? 403 : 400;
  throw new HttpError(status, message, code);
}

export interface SelectOptions {
  range?: { from: number; to: number };
  count?: boolean;
}

export async function dbSelect<T>(table: string, filters: Filters = {}, options: SelectOptions = {}): Promise<{ data: T; total: number | null }> {
  const headers = baseHeaders();
  if (options.count) headers.prefer = "count=exact";
  if (options.range) {
    headers["range-unit"] = "items";
    headers.range = `${options.range.from}-${options.range.to}`;
  }

  const res = await request(buildUrl(table, filters), { method: "GET", headers });
  if (!res.ok) await raiseForStatus(res);

  const data = (await res.json()) as T;
  const contentRange = res.headers.get("content-range");
  let total: number | null = null;
  if (contentRange && contentRange.includes("/")) {
    const raw = contentRange.split("/")[1];
    total = raw === "*" ? null : Number(raw);
  }
  return { data, total };
}

export async function dbInsert<T>(table: string, row: unknown, options: { returning?: boolean; filters?: Filters } = {}): Promise<T> {
  const headers = baseHeaders({ prefer: options.returning === false ? "return=minimal" : "return=representation" });
  const res = await request(buildUrl(table, options.filters ?? {}), {
    method: "POST",
    headers,
    body: JSON.stringify(row),
  });
  if (!res.ok) await raiseForStatus(res);
  if (options.returning === false) return undefined as T;
  return (await res.json()) as T;
}

export async function dbUpsert<T>(table: string, row: unknown, conflictColumn: string): Promise<T> {
  const headers = baseHeaders({ prefer: "resolution=merge-duplicates,return=representation" });
  const res = await request(buildUrl(table, { on_conflict: conflictColumn }), {
    method: "POST",
    headers,
    body: JSON.stringify(row),
  });
  if (!res.ok) await raiseForStatus(res);
  return (await res.json()) as T;
}

export async function dbUpdate<T>(table: string, filters: Filters, patch: unknown): Promise<T> {
  const headers = baseHeaders({ prefer: "return=representation" });
  const res = await request(buildUrl(table, filters), {
    method: "PATCH",
    headers,
    body: JSON.stringify(patch),
  });
  if (!res.ok) await raiseForStatus(res);
  return (await res.json()) as T;
}

export async function dbDelete(table: string, filters: Filters): Promise<void> {
  const headers = baseHeaders({ prefer: "return=minimal" });
  const res = await request(buildUrl(table, filters), { method: "DELETE", headers });
  if (!res.ok) await raiseForStatus(res);
}

export async function dbRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await request(new URL(`${env.restUrl}/rpc/${fn}`), {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify(args),
  });
  if (!res.ok) await raiseForStatus(res);
  return (await res.json()) as T;
}
