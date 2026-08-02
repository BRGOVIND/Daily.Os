"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarClock, Bell } from "lucide-react";
import { useAgenda, type AgendaDay } from "@/hooks/useAgenda";
import { COLOR_MAP } from "@/lib/constants";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface CalendarAgendaProps {
  today: Date;
  onOpenDay: (key: string) => void;
}

/**
 * A forward-looking agenda beneath the calendar: Today, Tomorrow and Upcoming,
 * grouped and tight. Reads open tasks live; tapping a task opens its day.
 */
export function CalendarAgenda({ today, onOpenDay }: CalendarAgendaProps) {
  const { today: todayDay, tomorrow, upcoming, openCount, loading } = useAgenda(today);

  if (loading) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10"
      aria-label="Agenda"
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <CalendarClock className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold text-ink">Agenda</h2>
        <span className="ml-auto text-xs text-ink-muted">
          {openCount === 0 ? "All clear" : `${openCount} open`}
        </span>
      </div>

      {openCount === 0 ? (
        <div className="rounded-2xl bg-card px-5 py-8 text-center text-sm text-ink-muted shadow-sm">
          Nothing scheduled ahead. Enjoy the open road.
        </div>
      ) : (
        <div className="space-y-4">
          <AgendaGroup label="Today" day={todayDay} onOpenDay={onOpenDay} emptyHint="Nothing planned for today." />
          <AgendaGroup label="Tomorrow" day={tomorrow} onOpenDay={onOpenDay} emptyHint="Tomorrow is wide open." />
          {upcoming.length > 0 && (
            <div>
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Upcoming
              </h3>
              <div className="space-y-3">
                {upcoming.map((d) => (
                  <AgendaGroup
                    key={d.key}
                    label={format(d.date, "EEEE, d MMM")}
                    day={d}
                    onOpenDay={onOpenDay}
                    dense
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}

function AgendaGroup({
  label,
  day,
  onOpenDay,
  emptyHint,
  dense = false,
}: {
  label: string;
  day: AgendaDay;
  onOpenDay: (key: string) => void;
  emptyHint?: string;
  dense?: boolean;
}) {
  const hasTasks = day.tasks.length > 0;
  if (!hasTasks && !emptyHint) return null;

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
      <button
        type="button"
        onClick={() => onOpenDay(day.key)}
        className={cn(
          "flex w-full items-center gap-2 px-4 text-left transition-colors hover:bg-fill/[0.02]",
          dense ? "py-2.5" : "py-3",
        )}
      >
        <span className={cn("font-semibold text-ink", dense ? "text-[13px]" : "text-sm")}>
          {label}
        </span>
        {hasTasks && (
          <span className="ml-auto text-xs text-ink-muted">
            {day.tasks.length} task{day.tasks.length === 1 ? "" : "s"}
          </span>
        )}
      </button>

      {hasTasks ? (
        <ul className="divide-y divide-fill/[0.04] px-1 pb-1">
          {day.tasks.slice(0, 6).map((t) => (
            <AgendaRow key={t.id} task={t} onOpen={() => onOpenDay(day.key)} />
          ))}
          {day.tasks.length > 6 && (
            <li>
              <button
                type="button"
                onClick={() => onOpenDay(day.key)}
                className="w-full px-3 py-2 text-left text-xs text-ink-muted hover:text-ink"
              >
                +{day.tasks.length - 6} more…
              </button>
            </li>
          )}
        </ul>
      ) : (
        <p className="px-4 pb-3 text-sm text-ink-muted">{emptyHint}</p>
      )}
    </div>
  );
}

function AgendaRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const dot = COLOR_MAP[task.color]?.dot ?? "#999";
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-fill/[0.03]"
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
        <span className="truncate text-sm text-ink">{task.title}</span>
        {task.priority === "high" && (
          <span className="shrink-0 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
            High
          </span>
        )}
        {task.reminderAt && (
          <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-ink-muted">
            <Bell className="h-3 w-3" />
            {format(task.reminderAt, "p")}
          </span>
        )}
      </button>
    </li>
  );
}
