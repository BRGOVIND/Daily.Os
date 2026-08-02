"use client";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** A calm, consistent empty state used across the workspace tabs. */
export function EmptyState({ icon, title, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-14 text-center">
      <div className="text-ink-muted/50">{icon}</div>
      <div>
        <p className="font-display text-xl font-light text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-muted">{hint}</p>
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
