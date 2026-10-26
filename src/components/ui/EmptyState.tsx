import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Shared empty / error state: quiet, readable, never a dead end. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-dark flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/15 border border-violet-500/20">
        <Icon size={28} className="text-violet-300" />
      </div>
      <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-gray-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
