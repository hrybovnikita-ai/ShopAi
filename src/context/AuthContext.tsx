import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  DEMO_AUTH_ENABLED,
  clearDemoAccount,
  createDemoAccount,
  readDemoAccount,
  toDemoUser,
} from "@/lib/demoAuth";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True while the signed-in user is a local demo account, not a real one. */
  isDemo: boolean;
  /** True when Demo Authentication Mode is available in this build. */
  demoEnabled: boolean;
  /**
   * `useReal` bypasses Demo Authentication Mode and verifies the credentials
   * against Supabase, which is required for administrator accounts.
   */
  signIn: (email: string, password: string, options?: { useReal?: boolean }) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const MISSING_CREDENTIALS = "Enter an email address and a password to continue.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const startDemoSession = (email: string, fullName?: string) => {
    const account = createDemoAccount(email, fullName);
    setSession(null);
    setUser(toDemoUser(account));
    setIsDemo(true);
    setLoading(false);
  };

  useEffect(() => {
    // A stored demo account survives refreshes and takes precedence: demo users
    // never touch Supabase, so real authentication stays untouched.
    if (DEMO_AUTH_ENABLED) {
      const account = readDemoAccount();
      if (account) {
        setUser(toDemoUser(account));
        setIsDemo(true);
        setLoading(false);
        return;
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, options: { useReal?: boolean } = {}) => {
    if (DEMO_AUTH_ENABLED && !options.useReal) {
      const trimmed = email.trim();
      if (!trimmed || !password) return { error: MISSING_CREDENTIALS };
      startDemoSession(trimmed);
      return { error: null };
    }

    // A real sign-in always clears any stored demo account first.
    clearDemoAccount();
    setIsDemo(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (DEMO_AUTH_ENABLED) {
      const trimmed = email.trim();
      if (!trimmed || !password) return { error: MISSING_CREDENTIALS };
      startDemoSession(trimmed, fullName);
      return { error: null };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    const wasDemo = isDemo;
    clearDemoAccount();
    setIsDemo(false);
    setUser(null);
    setSession(null);
    if (!wasDemo) await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isDemo, demoEnabled: DEMO_AUTH_ENABLED, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
