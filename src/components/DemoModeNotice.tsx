import { FlaskConical } from "lucide-react";

/**
 * Shown on Sign In / Sign Up while Demo Authentication Mode is enabled, so it is
 * clear that the account is temporary and has no access to real user data.
 */
export function DemoModeNotice() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
      <FlaskConical size={16} className="mt-0.5 shrink-0" />
      <p>
        <span className="font-semibold">Demo mode:</span> use any email address and any password — no
        real account is created and nothing is sent to the authentication server. Demo accounts are
        temporary and can’t access real orders, saved data or account settings.
      </p>
    </div>
  );
}
