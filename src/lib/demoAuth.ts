import type { User } from "@supabase/supabase-js";

/**
 * Demo Authentication Mode
 *
 * Lets visitors try ShopAi with any email address and any non-empty password,
 * without a Supabase account: no request is made and no password is ever stored
 * or transmitted. The demo account (email + display name only) is kept in
 * localStorage so it survives a page refresh.
 *
 * Enabled while running the dev server the Base44 preview uses, and explicitly
 * with VITE_DEMO_AUTH=true. A production build has DEV=false and therefore keeps
 * real Supabase authentication only; VITE_DEMO_AUTH=false disables it anywhere.
 */
const flag = import.meta.env.VITE_DEMO_AUTH as string | undefined;

export const DEMO_AUTH_ENABLED = flag === "false" ? false : flag === "true" || import.meta.env.DEV;

export interface DemoAccount {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;
}

const STORAGE_KEY = "shopai.demoAccount";

export function readDemoAccount(): DemoAccount | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoAccount>;
    if (!parsed?.id || !parsed?.email) return null;
    return {
      id: parsed.id,
      email: parsed.email,
      fullName: parsed.fullName ?? null,
      createdAt: parsed.createdAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/** Creates (or refreshes) the stored demo account. The password is never stored. */
export function createDemoAccount(email: string, fullName?: string): DemoAccount {
  const existing = readDemoAccount();
  const account: DemoAccount = {
    id: existing && existing.email === email ? existing.id : `demo-${crypto.randomUUID()}`,
    email,
    fullName: fullName?.trim() || existing?.fullName || null,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  return account;
}

export function clearDemoAccount(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Shapes a demo account like a Supabase user so the UI stays identical. */
export function toDemoUser(account: DemoAccount): User {
  return {
    id: account.id,
    email: account.email,
    aud: "demo",
    created_at: account.createdAt,
    user_metadata: { full_name: account.fullName, demo: true },
    app_metadata: { provider: "demo", demo: true },
  } as unknown as User;
}
