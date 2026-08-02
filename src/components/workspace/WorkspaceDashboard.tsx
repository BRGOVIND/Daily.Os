"use client";

import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Link2,
  Rocket,
  StickyNote,
} from "lucide-react";
import type { DashboardData } from "@/workspace";
import { COLOR_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatMinutes, relativeDay } from "./lib";
import type { WorkspaceTab } from "./tabs";

interface WorkspaceDashboardProps {
  data: DashboardData;
  onOpenTab: (tab: WorkspaceTab) => void;
  onOpenDay: (key: string) => void;
}

/**
 * Module 8 — the workspace dashboard: headline stats, the active-task queue,
 * recent notes and resources, active missions and a timeline preview. Every
 * strip links deeper into the relevant tab.
 */
export function WorkspaceDashboard({
  data,
  onOpenTab,
  onOpenDay,
}: WorkspaceDashboardProps) {
  const { stats, activeTasks, recentNotes, recentResources, activeMissions, recentTimeline } = data;

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Tasks done"
          value={`${stats.taskCompleted}/${stats.taskTotal}`}
        />
        <Stat
          icon={<Clock className="h-4 w-4" />}
          label="Time invested"
          value={formatMinutes(stats.timeInvestedMinutes)}
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          label="Journal streak"
          value={`${stats.journalStreak}d`}
        />
        <Stat
          icon={<Rocket className="h-4 w-4" />}
          label="Missions"
          value={`${stats.missionCompleted}/${stats.missionTotal}`}
        />
      </div>

      {/* Active tasks */}
      <Section
        title="Active tasks"
        icon={<Calendar className="h-4 w-4" />}
        count={activeTasks.length}
        onSeeAll={activeTasks.length > 0 ? () => onOpenDay(activeTasks[0].date) : undefined}
      >
        {activeTasks.length === 0 ? (
          <Empty>Nothing open — a clear runway.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {activeTasks.slice(0, 5).map(({ task, date }) => (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onOpenDay(date)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-canvas"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: COLOR_MAP[task.color].dot }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                    {task.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-muted">
                    {relativeDay(date)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Active missions */}
      {activeMissions.length > 0 && (
        <Section
          title="Missions"
          icon={<Rocket className="h-4 w-4" />}
          count={activeMissions.length}
        >
          <ul className="space-y-2">
            {activeMissions.slice(0, 3).map((m) => {
              const total = m.milestones.length;
              const done = m.milestones.filter((x) => x.done).length;
              const pct = total === 0 ? 0 : Math.round((done / total) * 100);
              return (
                <li key={m.id} className="flex items-center gap-3">
                  <span className="text-base">{m.icon || "🚀"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] text-ink">{m.title}</span>
                      <span className="shrink-0 text-[11px] text-ink-muted">{pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: COLOR_MAP[m.color].dot }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      {/* Recent notes & resources */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section
          title="Recent notes"
          icon={<StickyNote className="h-4 w-4" />}
          count={stats.noteCount}
          onSeeAll={() => onOpenTab("notes")}
        >
          {recentNotes.length === 0 ? (
            <Empty>No notes yet.</Empty>
          ) : (
            <ul className="space-y-1">
              {recentNotes.map((n) => (
                <li key={n.id} className="flex items-center gap-2 px-2 py-1 text-[13px] text-ink">
                  <StickyNote className="h-3.5 w-3.5 shrink-0 text-ink-muted/60" />
                  <span className="truncate">{n.title || "Untitled note"}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Recent resources"
          icon={<Link2 className="h-4 w-4" />}
          count={stats.resourceCount}
          onSeeAll={() => onOpenTab("resources")}
        >
          {recentResources.length === 0 ? (
            <Empty>No resources yet.</Empty>
          ) : (
            <ul className="space-y-1">
              {recentResources.map((r) => (
                <li key={r.id} className="flex items-center gap-2 px-2 py-1 text-[13px] text-ink">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-ink-muted/60" />
                  <span className="truncate">{r.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Timeline preview */}
      <Section
        title="Recent activity"
        icon={<Clock className="h-4 w-4" />}
        onSeeAll={() => onOpenTab("timeline")}
      >
        {recentTimeline.length === 0 ? (
          <Empty>Your story starts here.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {recentTimeline.map((e) => (
              <li key={e.id} className="flex items-center gap-2.5 px-2 py-1">
                <span className="text-sm">{e.icon}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{e.detail}</span>
                <span className="shrink-0 text-[11px] text-ink-muted">{relativeDay(e.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-3">
      <div className="flex items-center gap-1.5 text-ink-muted">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-2xl font-light text-ink">{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  onSeeAll,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {icon}
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
              {count}
            </span>
          )}
        </h4>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-[12px] font-medium text-accent hover:underline"
          >
            See all
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className={cn("px-2 py-3 text-[13px] text-ink-muted/70")}>{children}</p>;
}
