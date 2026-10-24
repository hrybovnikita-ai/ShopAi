/**
 * Access-token verification (HS256, the same secret GoTrue signs with) and the
 * administrator check. Authorization always happens here, on the server: the
 * frontend only hides navigation for convenience.
 */
import { dbSelect } from "./db.ts";
import { HttpError } from "./http.ts";
import { env } from "./env.ts";

export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
}

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  aud?: string | string[];
}

const encoder = new TextEncoder();

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  if (!env.jwtSecret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(env.jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(parts[2]),
      encoder.encode(`${parts[0]}.${parts[1]}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(parts[1]))) as JwtPayload;
    if (!payload.sub || !payload.exp || payload.exp * 1000 <= Date.now()) return null;

    return { id: payload.sub, email: payload.email ?? null, role: payload.role ?? "authenticated" };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (!token || scheme?.toLowerCase() !== "bearer") return null;
  return verifyToken(token);
}

export async function isAdmin(user: AuthUser | null): Promise<boolean> {
  if (!user) return false;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(user.id)) return false;
  const { data } = await dbSelect<{ user_id: string }[]>("admin_users", {
    select: "user_id",
    user_id: `eq.${user.id}`,
    limit: "1",
  });
  return data.length > 0;
}

export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getAuthUser(req);
  if (!user) throw new HttpError(401, "Sign in with an administrator account to continue", "unauthenticated");
  return user;
}

export async function requireAdmin(req: Request): Promise<AuthUser> {
  const user = await requireUser(req);
  if (!(await isAdmin(user))) {
    throw new HttpError(403, "Administrator access required", "forbidden");
  }
  return user;
}
