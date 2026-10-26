import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Database,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShieldCheck,
  ShieldAlert,
  Tags,
  Users,
  Activity,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";

const ADMIN_LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package, end: false },
  { to: "/admin/categories", label: "Categories", icon: Tags, end: false },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText, end: false },
  { to: "/admin/customers", label: "Customers", icon: Users, end: false },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquare, end: false },
  { to: "/admin/monitor", label: "System Monitor", icon: Activity, end: false },
];

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isDemo, loading } = useAuth();
  const { isAdmin, checking, error } = useAdmin();

  if (loading || checking) {
    return (
      <div className="section-padding">
        <div className="container-max flex items-center gap-3 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          Verifying administrator access…
        </div>
      </div>
    );
  }

  if (isAdmin) return <>{children}</>;

  return (
    <div className="section-padding">
      <div className="container-max max-w-xl">
        <div className="glass-dark p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
            <ShieldAlert size={26} />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Administrator access required</h1>
          <p className="mt-3 text-sm text-gray-400">
            {isDemo
              ? "Demo accounts are temporary and never receive administrator rights. Sign out and sign in with a verified administrator account."
              : user
                ? "This account is signed in but does not have administrator rights. Access is enforced by the API and the database, not just by this page."
                : "Sign in with a verified administrator account to open the dashboard. Access is enforced by the API and the database."}
          </p>
          {error && <p className="mt-3 text-xs text-amber-300">{error}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {user ? (
              <Link to="/" className="btn-secondary !py-2.5 text-sm">
                Back to store
              </Link>
            ) : (
              <Link to="/signin" className="btn-primary !py-2.5 text-sm">
                Sign in
              </Link>
            )}
            <Link to="/" className="btn-ghost">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="section-padding">
      <div className="container-max">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              <ShieldCheck size={13} />
              Administrator area · server-verified
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-gray-400">
              Signed in as <span className="text-gray-200">{user?.email}</span>
            </p>
          </div>
          <Link to="/" className="btn-secondary !py-2.5 text-sm">
            View storefront
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Admin sections" className="glass-dark h-fit p-2">
            <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {ADMIN_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.to} className="shrink-0 lg:w-full">
                    <NavLink
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-violet-600/20 text-white"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`
                      }
                    >
                      <Icon size={16} />
                      {link.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
            <div className="mt-2 hidden items-center gap-2 border-t border-white/10 px-3 py-3 text-[11px] text-gray-500 lg:flex">
              <Database size={13} />
              PostgreSQL · Row-level security on
            </div>
          </nav>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
