"use client";

import { BarChart3 } from "lucide-react";
import type { WorkspaceStats } from "@/workspace";
import { fromDateKey } from "@/lib/date";
import { addDays, format } from "date-fns";
import { formatMinutes } from "./lib";

interface StatsTabProps {
  stats: WorkspaceStats;
  todayKey: string;
}

/** Module 12 — per-workspace statistics. */
export function StatsTab({ stats, todayKey }: StatsTabProps) {
  const rate = Math.round(stats.taskCompletionRate * 100);
  const peak = Math.max(1, ...stats.weeklyActivity);
  // Weekday label for each bar: the last N days ending today, oldest → newest.
  const start = addDays(fromDateKey(todayKey), -(stats.weeklyActivity.length - 1));
  const labels = stats.weeklyActivity.map((_, i) =>
    format(addDays(start, i), "EEEEE"),
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Tile label="Tasks completed" value={`${stats.taskCompleted}`} sub={`of ${stats.taskTotal}`} />
        <Tile label="Completion rate" value={`${rate}%`} />
        <Tile label="Time invested" value={formatMinutes(stats.timeInvestedMinutes)} />
        <Tile label="Missions done" value={`${stats.missionCompleted}`} sub={`of ${stats.missionTotal}`} />
        <Tile label="Journal streak" value={`${stats.journalStreak}`} sub="days" />
        <Tile label="Resources" value={`${stats.resourceCount}`} sub={`${stats.noteCount} notes`} />
      </div>

      <section className="rounded-2xl border border-line bg-card p-4">
        <h4 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          <BarChart3 className="h-4 w-4" /> Last 7 days
        </h4>
        <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
          {stats.weeklyActivity.map((count, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-accent/80 transition-all"
                  style={{ height: `${(count / peak) * 100}%`, minHeight: count > 0 ? 4 : 0 }}
                  title={`${count} completed`}
                />
              </div>
              <span className="text-[10px] text-ink-muted">{labels[i]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-3.5">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-light text-ink">
        {value}
        {sub && <span className="ml-1 text-sm text-ink-muted">{sub}</span>}
      </p>
    </div>
  );
}
