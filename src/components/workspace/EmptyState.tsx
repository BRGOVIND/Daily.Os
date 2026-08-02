"use client";

import { motion, useReducedMotion } from "framer-motion";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * A calm, consistent empty state: an accent-haloed icon that gently breathes,
 * editorial title and an inviting hint. Reused across the app so every "nothing
 * here yet" moment teaches and invites rather than reading as blank. Honors
 * reduced-motion.
 */
export function EmptyState({ icon, title, hint, actionLabel, onAction }: EmptyStateProps) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-dashed border-line py-14 text-center">
      <motion.div
        aria-hidden
        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
        animate={
          reduce
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, y: [0, -4, 0] }
        }
        transition={
          reduce
            ? { duration: 0.2 }
            : {
                opacity: { duration: 0.4 },
                scale: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }
        }
        className="relative flex h-16 w-16 items-center justify-center"
      >
        {/* Soft accent halo — the "subtle illustration". */}
        <span className="absolute inset-0 rounded-full bg-accent/[0.08]" />
        <span className="absolute inset-2 rounded-full bg-accent/[0.06]" />
        <span className="relative text-accent/70">{icon}</span>
      </motion.div>

      <div>
        <p className="font-display text-xl font-light text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-ink-muted">
          {hint}
        </p>
      </div>

      {actionLabel && onAction && (
        <motion.button
          type="button"
          onClick={onAction}
          whileTap={{ scale: 0.96 }}
          className="mt-1 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-glow transition-colors hover:bg-accent-hover"
        >
          {actionLabel}
        </motion.button>
      )}
    </div>
  );
}
