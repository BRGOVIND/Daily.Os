"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import type { TimelineEvent } from "@/workspace";
import { relativeDay } from "./lib";
import { EmptyState } from "./EmptyState";

interface TimelineTabProps {
  events: TimelineEvent[];
  onOpenDay: (key: string) => void;
}

/** Module 5 — the workspace's automatically-built chronological history. */
export function TimelineTab({ events, onOpenDay }: TimelineTabProps) {
  const groups = useMemo(() => {
    const byDate = new Map<string, TimelineEvent[]>();
    for (const e of events) {
      const list = byDate.get(e.date) ?? [];
      list.push(e);
      byDate.set(e.date, list);
    }
    return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [events]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-8 w-8" />}
        title="Your story starts here."
        hint="As you complete tasks, hit milestones, journal and save resources, they appear here in order."
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map(([date, dayEvents]) => (
        <div key={date}>
          <button
            type="button"
            onClick={() => onOpenDay(date)}
            className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-muted transition-colors hover:text-accent"
          >
            {relativeDay(date)}
          </button>
          <ul className="relative space-y-3 border-l border-line pl-5">
            {dayEvents.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full bg-card text-[11px] ring-4 ring-canvas">
                  {e.icon}
                </span>
                <p className="text-[13px] text-ink">{e.detail}</p>
                <p className="text-[11px] text-ink-muted/70">{e.title}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
