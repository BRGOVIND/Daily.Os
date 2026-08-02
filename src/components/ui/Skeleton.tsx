import { cn } from "@/lib/utils";

/**
 * A calm placeholder block. Uses a soft pulse on a themeable fill so it reads
 * correctly on light, dark and paper — and collapses to a static block under
 * prefers-reduced-motion (handled globally in globals.css).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-fill/[0.07]", className)}
    />
  );
}
