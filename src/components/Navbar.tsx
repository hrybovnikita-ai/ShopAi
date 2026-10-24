import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingBag, Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "AI Search", path: "/discover" },
  { label: "About", path: "/about" },
  { label: "Contacts", path: "/contacts" },
  { label: "Pricing", path: "/pricing" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { user, isDemo, signOut } = useAuth();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-ink-950/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-violet-600/30 transition-transform group-hover:scale-110">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Shop<span className="gradient-text">Ai</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full gradient-bg" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin" className="btn-secondary !px-3 !py-2 text-sm">
                <ShieldCheck size={16} className="text-violet-300" />
                Admin
              </Link>
            )}
            <Link
              to="/cart"
              className="relative rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-xs font-bold text-white animate-pulse-glow">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                <span className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full gradient-bg text-xs font-bold uppercase text-white shadow-lg shadow-violet-600/30">
                    {(user.email ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:flex flex-col leading-tight">
                    <span className="max-w-[14rem] truncate">{user.email}</span>
                    {isDemo && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                        Demo · temporary
                      </span>
                    )}
                  </span>
                </span>
                <button onClick={handleSignOut} className="btn-ghost">
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn-ghost">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary !px-5 !py-2.5 text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-lg p-2 text-gray-300 hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-ink-950/95 backdrop-blur-xl animate-fade-in">
            <div className="px-2 py-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block rounded-lg px-4 py-3 text-sm font-medium ${
                    location.pathname === link.path
                      ? "bg-violet-600/20 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-violet-200 hover:bg-violet-600/15 hover:text-white"
                >
                  <ShieldCheck size={16} />
                  Admin Dashboard
                </Link>
              )}
              <Link
                to="/cart"
                className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              <div className="pt-2 border-t border-white/10 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-bg text-xs font-bold uppercase text-white">
                        {(user.email ?? "?").charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex flex-col leading-tight">
                        <span className="truncate">{user.email}</span>
                        {isDemo && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                            Demo · temporary
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="btn-secondary w-full"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/signin" className="btn-secondary w-full">
                      Sign In
                    </Link>
                    <Link to="/signup" className="btn-primary w-full">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
