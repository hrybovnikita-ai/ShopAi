/** Structured request/error logging that feeds the System Monitor page. */
import { dbDelete, dbInsert } from "./db.ts";
import { env } from "./env.ts";
import type { AuthUser } from "./auth.ts";

let pruneCounter = 0;

export async function recordRequest(entry: {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  user: AuthUser | null;
}): Promise<void> {
  try {
    await dbInsert("api_request_logs", {
      method: entry.method,
      path: entry.path.slice(0, 300),
      status: entry.status,
      duration_ms: Math.round(entry.durationMs),
      user_id: entry.user?.id ?? null,
    }, { returning: false });

    pruneCounter += 1;
    if (pruneCounter % 50 === 0) await pruneOldLogs();
  } catch {
    // Monitoring must never break a request.
  }
}

export async function recordError(entry: {
  level: "error" | "warning";
  message: string;
  path: string;
  method: string;
  status?: number;
  code?: string;
}): Promise<void> {
  try {
    await dbInsert("app_errors", {
      level: entry.level,
      message: entry.message.slice(0, 500),
      path: entry.path.slice(0, 300),
      method: entry.method,
      status: entry.status ?? null,
      code: entry.code ?? null,
    }, { returning: false });
  } catch {
    // ignore
  }
}

/** Keeps the monitoring tables small in long-running sandboxes. */
async function pruneOldLogs(): Promise<void> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    await dbDelete("api_request_logs", { created_at: `lt.${cutoff}` });
    await dbDelete("app_errors", { created_at: `lt.${cutoff}` });
  } catch {
    // ignore
  }
}

export function logLine(level: "info" | "warn" | "error", message: string, extra: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, message, service: "shopai-api", env: env.environment, ts: new Date().toISOString(), ...extra });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
