import type { AuthUser } from "./auth.ts";

export interface RouteContext {
  req: Request;
  url: URL;
  params: Record<string, string>;
  /** Set by the router after the administrator check for /admin routes. */
  user: AuthUser | null;
}
