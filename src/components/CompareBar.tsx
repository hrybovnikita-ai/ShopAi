import { Link, useLocation } from "react-router-dom";
import { Scale, X } from "lucide-react";
import { useCompare } from "@/context/CompareContext";

export function CompareBar() {
  const { selection, clear } = useCompare();
  const location = useLocation();

  if (selection.length === 0 || location.pathname === "/compare") return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className="glass flex items-center gap-3 border-violet-500/30 p-3 shadow-2xl shadow-violet-900/40">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-bg text-white">
          <Scale size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{selection.length} of 4 selected</p>
          <p className="truncate text-xs text-gray-400">
            {selection.map((product) => product.name).join(" · ")}
          </p>
        </div>
        <Link
          to="/compare"
          className={`btn-primary !px-4 !py-2 text-sm ${selection.length < 2 ? "pointer-events-none opacity-50" : ""}`}
        >
          Compare
        </Link>
        <button
          type="button"
          onClick={clear}
          aria-label="Clear comparison"
          className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
