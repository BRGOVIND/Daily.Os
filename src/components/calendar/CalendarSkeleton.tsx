import { Skeleton } from "@/components/ui/Skeleton";

/**
 * A first-paint placeholder shaped like the calendar screen, so booting feels
 * like the app loading rather than a spinner. Purely presentational.
 */
export function CalendarSkeleton() {
  return (
    <div className="min-h-dvh bg-canvas">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-6 sm:px-8 sm:pt-8">
        <Skeleton className="h-7 w-32 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-3 pt-8 sm:px-8 sm:pt-14">
        {/* Month header */}
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-8 w-40 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>

        {/* Weekday row */}
        <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-3 w-8 rounded" />
          ))}
        </div>

        {/* 6-week grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 42 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl sm:rounded-2xl" />
          ))}
        </div>

        {/* Today preview */}
        <Skeleton className="mt-8 h-24 w-full rounded-3xl" />
      </main>
    </div>
  );
}
