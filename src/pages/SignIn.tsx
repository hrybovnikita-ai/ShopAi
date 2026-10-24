import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DemoModeNotice } from "@/components/DemoModeNotice";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useRealAccount, setUseRealAccount] = useState(false);
  const { signIn, demoEnabled } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password, { useReal: useRealAccount });
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      navigate(useRealAccount ? "/admin" : "/");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center section-padding">
      <div className="container-max max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-violet-600/30 mb-4">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-gray-400">Sign in to your ShopAi account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-dark p-8 space-y-5">
          {demoEnabled && !useRealAccount && <DemoModeNotice />}

          {demoEnabled && (
            <label className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={useRealAccount}
                onChange={(event) => setUseRealAccount(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-ink-800 text-violet-600"
              />
              <span>
                Sign in with a real account
                <span className="mt-0.5 block text-gray-500">
                  Skips demo mode and verifies the credentials with Supabase. Required for administrators.
                </span>
              </span>
            </label>
          )}

          {demoEnabled && useRealAccount && import.meta.env.DEV && (
            <p className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-200">
              Local sandbox administrator: <span className="font-medium">admin@shopai.dev</span> /{" "}
              <span className="font-medium">ShopAiAdmin!2026</span>
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
              <input type="checkbox" className="rounded border-white/20 bg-ink-800 text-violet-600" />
              Remember me
            </label>
            <a href="#" className="text-violet-300 hover:text-violet-200">
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-violet-300 hover:text-violet-200 font-medium">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
