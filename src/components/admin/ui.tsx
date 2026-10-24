import { useEffect, type ElementType, type ReactNode } from "react";
import { X, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-gray-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "violet",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ElementType;
  accent?: "violet" | "blue" | "emerald" | "amber";
}) {
  const accents = {
    violet: "from-violet-600/30 to-violet-600/5 text-violet-300",
    blue: "from-blue-600/30 to-blue-600/5 text-blue-300",
    emerald: "from-emerald-600/30 to-emerald-600/5 text-emerald-300",
    amber: "from-amber-500/30 to-amber-500/5 text-amber-300",
  } as const;

  return (
    <div className="glass-dark p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accents[accent]}`}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "violet" }) {
  const tones = {
    neutral: "bg-white/5 text-gray-300 border-white/10",
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    danger: "bg-red-500/10 text-red-300 border-red-500/30",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  } as const;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/5 ${className}`} />;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: ElementType; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="glass-dark flex flex-col items-center gap-3 p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-300">
        <Icon size={22} />
      </span>
      <div>
        <p className="font-display font-semibold text-white">{title}</p>
        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) {
    return <p className="text-xs text-gray-500">{total} result{total === 1 ? "" : "s"}</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages} · {total} result{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className="btn-secondary !px-3 !py-2 text-sm disabled:opacity-40">
          <ChevronLeft size={16} />
          Previous
        </button>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages} className="btn-secondary !px-3 !py-2 text-sm disabled:opacity-40">
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export function Modal({ open, title, description, onClose, children, footer }: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div role="dialog" aria-modal="true" aria-label={title} className="glass-dark my-8 w-full max-w-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 p-5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  loading = false,
  tone = "danger",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button type="button" onClick={onCancel} className="btn-secondary !py-2.5 text-sm" disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
              tone === "danger"
                ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"
                : "btn-primary !py-2.5 text-sm"
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {tone === "danger" && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
            <AlertTriangle size={18} />
          </span>
        )}
        <p className="text-sm text-gray-300">{description}</p>
      </div>
    </Modal>
  );
}
