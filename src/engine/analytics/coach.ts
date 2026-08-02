/**
 * Module 8 — Weekly Coach.
 *
 * Generates a handful of plain-language insights each week by comparing the
 * last 7 days to the 7 before. Everything here is template-driven string
 * assembly over computed numbers — deliberately NOT AI.
 */

import { format, parseISO, subDays } from "date-fns";
import type { DayRecord, HabitDef } from "@/types";
import type { DatedTask } from "@/engine/models/types";
import type { CoachInsight, WeeklyCoachReport } from "@/engine/models/types";
import { timesDeferred } from "@/engine/utils/tasks";

interface WeekAgg {
  completed: number;
  byWeekday: Map<string, number>;
  habitDone: Map<string, number>;
}

function aggregate(
  today: string,
  offset: number,
  byDate: Map<string, DayRecord>,
): WeekAgg {
  const todayDate = parseISO(today);
  const agg: WeekAgg = {
    completed: 0,
    byWeekday: new Map(),
    habitDone: new Map(),
  };
  for (let i = 0; i < 7; i += 1) {
    const date = subDays(todayDate, offset + i);
    const day = byDate.get(format(date, "yyyy-MM-dd"));
    if (!day) continue;
    const done = day.tasks.filter((t) => t.completed).length;
    agg.completed += done;
    const wd = format(date, "EEEE");
    agg.byWeekday.set(wd, (agg.byWeekday.get(wd) ?? 0) + done);
    for (const [habitId, checked] of Object.entries(day.habitLog ?? {})) {
      if (checked) agg.habitDone.set(habitId, (agg.habitDone.get(habitId) ?? 0) + 1);
    }
  }
  return agg;
}

export function weeklyCoach(
  today: string,
  byDate: Map<string, DayRecord>,
  habits: HabitDef[],
  windowTasks: DatedTask[],
): WeeklyCoachReport {
  const thisWeek = aggregate(today, 0, byDate);
  const lastWeek = aggregate(today, 7, byDate);
  const weekLabel = `${format(subDays(parseISO(today), 6), "MMM d")} – ${format(
    parseISO(today),
    "MMM d",
  )}`;

  const insights: CoachInsight[] = [];

  // Most / least productive weekday.
  const weekdayEntries = [...thisWeek.byWeekday.entries()].filter(
    ([, v]) => v > 0,
  );
  if (weekdayEntries.length > 0) {
    const most = weekdayEntries.reduce((a, b) => (b[1] > a[1] ? b : a));
    insights.push({
      key: "most-productive",
      icon: "🌟",
      title: "Most productive day",
      detail: `${most[0]} — ${most[1]} task${most[1] === 1 ? "" : "s"} completed.`,
    });
    if (weekdayEntries.length > 1) {
      const least = weekdayEntries.reduce((a, b) => (b[1] < a[1] ? b : a));
      insights.push({
        key: "least-productive",
        icon: "🌙",
        title: "Quietest day",
        detail: `${least[0]} was your lightest — a natural time to recharge.`,
      });
    }
  }

  // Most consistent habit.
  const habitName = (id: string) =>
    habits.find((h) => h.id === id)?.name ?? "a habit";
  if (thisWeek.habitDone.size > 0) {
    const [bestId, bestCount] = [...thisWeek.habitDone.entries()].reduce(
      (a, b) => (b[1] > a[1] ? b : a),
    );
    insights.push({
      key: "best-habit",
      icon: "🔥",
      title: "Most consistent habit",
      detail: `${habitName(bestId)} — ${bestCount}/7 days.`,
    });
  }

  // Declining habit (dropped the most vs last week).
  let declining: { id: string; drop: number } | null = null;
  for (const h of habits) {
    const now = thisWeek.habitDone.get(h.id) ?? 0;
    const before = lastWeek.habitDone.get(h.id) ?? 0;
    const drop = before - now;
    if (drop >= 2 && (!declining || drop > declining.drop)) {
      declining = { id: h.id, drop };
    }
  }
  if (declining) {
    insights.push({
      key: "declining-habit",
      icon: "📉",
      title: "Habit to watch",
      detail: `${habitName(declining.id)} slipped ${declining.drop} days versus last week.`,
    });
  }

  // Repeatedly postponed tasks.
  const postponed = windowTasks.filter(
    (t) => !t.completed && timesDeferred(t) >= 2,
  );
  if (postponed.length > 0) {
    insights.push({
      key: "postponed",
      icon: "↩️",
      title: "Repeatedly postponed",
      detail: `${postponed.length} task${postponed.length === 1 ? "" : "s"} keep sliding — consider shrinking or rescheduling ${postponed.length === 1 ? "it" : "them"}.`,
    });
  }

  // Estimated improvement.
  const improvement =
    lastWeek.completed === 0
      ? thisWeek.completed > 0
        ? 100
        : 0
      : Math.round(
          ((thisWeek.completed - lastWeek.completed) / lastWeek.completed) * 100,
        );
  if (thisWeek.completed > 0 || lastWeek.completed > 0) {
    insights.push({
      key: "improvement",
      icon: improvement >= 0 ? "📈" : "🧭",
      title: "Versus last week",
      detail:
        improvement > 0
          ? `You completed ${improvement}% more than last week — momentum is building.`
          : improvement < 0
            ? `Output dipped ${Math.abs(improvement)}% — a lighter week is fine; ease back in.`
            : "On par with last week — steady progress.",
    });
  }

  return {
    weekLabel,
    insights,
    improvement,
    hasData: insights.length > 0,
  };
}
