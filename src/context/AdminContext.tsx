import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiRequest, isAuthorizationError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { AdminSession } from "@/types/admin";

interface AdminContextValue {
  /** Server-confirmed administrator rights. Never used as the only gate. */
  isAdmin: boolean;
  checking: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, isDemo, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (loading) return;

    // Demo accounts have no token, so they can never be administrators.
    if (!user || isDemo) {
      setIsAdmin(false);
      setChecking(false);
      setError(null);
      return;
    }

    setChecking(true);
    try {
      const session = await apiRequest<AdminSession>("/admin/session");
      setIsAdmin(session.isAdmin);
      setError(null);
    } catch (err) {
      setIsAdmin(false);
      setError(
        isAuthorizationError(err)
          ? "Administrator status could not be verified."
          : "The admin service is unavailable.",
      );
    } finally {
      setChecking(false);
    }
  }, [user, isDemo, loading]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminContext.Provider value={{ isAdmin, checking, error, refresh }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
