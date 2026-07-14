"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { db } from "@/lib/db";
import { toDateKey } from "@/lib/date";
import { dayProgress, type DayStatus } from "@/lib/status";
import type { DayRecord, HabitDef } from "@/types";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type TrendRange = "week" | "month" | "year";

export interface TrendPoint {
  label: string;
  key: string;
  task: number; // 0..100
  habit: number;
  focus: number;
}

export interface HeatCell {
  key: string;
  date: Date;
  ratio: number;
  status: DayStatus;
  total: number;
  completed: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number; // 0..1
}

export type TreeStage = 0 | 1 | 2 | 3 | 4;

export interface JournalStats {
  todayCompletion: number;
  weekCompletion: number;
  monthProgress: number;
  currentStreak: number;
  longestStreak: number;
  tasksThisWeek: number;
  tasksAllTime: number;
  habitsThisWeek: number;
  averageCompletion: number;
  activeDays: number;
  trends: Record<TrendRange, TrendPoint[]>;
  heatmap: HeatCell[][];
  achievements: Achievement[];
  yearInReview: {
    mostProductiveMonth: { label: string; value: number };
    bestHabit: { name: string; value: number } | null;
    averageCompletion: number;
    longestStreak: number;
    mostActiveWeekday: { label: string; value: number };
    bestWeek: { label: string; value: number };
  };
  tree: {
    stage: TreeStage;
    growth: number; // 0..1 within-stage
    score: number; // 0..100 consistency-weighted
  };
}

interface DailyMetric {
  tTotal: number;
  tDone: number;
  hDone: number;
  fTotal: number;
  fDone: number;
}

const HEATMAP_WEEKS = 27;

function pct(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/**
 * The full analytical backbone for the statistics journal. Reads all days +
 * habit definitions once and derives every metric in a single memo. Inert when
 * `today` is null (e.g. the modal is closed).
 */
export function useJournalStats(today: Date | null): JournalStats | null {
  const days = useLiveQuery(
    () => (today ? db.days.toArray() : Promise.resolve<DayRecord[]>([])),
    [today !== null],
  );
  const habitDefs = useLiveQuery(
    () => (today ? db.habits.toArray() : Promise.resolve<HabitDef[]>([])),
    [today !== null],
  );

  return useMemo(() => {
    if (!today || !days || !habitDefs) return null;

    const byDate = new Map<string, DayRecord>();
    for (const d of days) byDate.set(d.date, d);
    const habitCount = habitDefs.length;

    const metric = (key: string): DailyMetric => {
      const d = byDate.get(key);
      if (!d) return { tTotal: 0, tDone: 0, hDone: 0, fTotal: 0, fDone: 0 };
      return {
        tTotal: d.tasks.length,
        tDone: d.tasks.filter((t) => t.completed).length,
        hDone: Object.values(d.habitLog ?? {}).filter(Boolean).length,
        fTotal: d.focus.length,
        fDone: d.focus.filter((f) => f.done).length,
      };
    };

    const todayKey = toDateKey(today);
    const todayM = metric(todayKey);

    // ---- Streaks (a "complete" day has tasks and all done) --------------
    const isComplete = (m: DailyMetric) => m.tTotal > 0 && m.tDone === m.tTotal;
    const completeDates = days
      .filter((d) => {
        const m = metric(d.date);
        return isComplete(m);
      })
      .map((d) => d.date)
      .sort();

    let longestStreak = 0;
    {
      let run = 0;
      let prev: Date | null = null;
      for (const key of completeDates) {
        const date = new Date(`${key}T00:00:00`);
        if (prev && differenceInCalendarDays(date, prev) === 1) run += 1;
        else run = 1;
        longestStreak = Math.max(longestStreak, run);
        prev = date;
      }
    }

    let currentStreak = 0;
    {
      let cursor = new Date(today);
      if (!isComplete(todayM)) cursor = subDays(cursor, 1);
      for (let i = 0; i < 730; i += 1) {
        if (isComplete(metric(toDateKey(cursor)))) {
          currentStreak += 1;
          cursor = subDays(cursor, 1);
        } else break;
      }
    }

    // ---- Weekly / monthly aggregates ------------------------------------
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: today });
    let wDone = 0,
      wTotal = 0,
      habitsThisWeek = 0,
      tasksThisWeek = 0;
    for (const d of weekDays) {
      const m = metric(toDateKey(d));
      wDone += m.tDone;
      wTotal += m.tTotal;
      tasksThisWeek += m.tDone;
      habitsThisWeek += m.hDone;
    }

    const monthStart = startOfMonth(today);
    const monthDays = eachDayOfInterval({ start: monthStart, end: today });
    let mDone = 0,
      mTotal = 0;
    for (const d of monthDays) {
      const m = metric(toDateKey(d));
      mDone += m.tDone;
      mTotal += m.tTotal;
    }

    // ---- All-time totals ------------------------------------------------
    let tasksAllTime = 0;
    let activeDays = 0;
    const yearAgoKey = toDateKey(subYears(today, 1));
    let avgSumPct = 0;
    let avgCount = 0;
    const weekdayTotals = new Array(7).fill(0);
    for (const d of days) {
      const m = metric(d.date);
      tasksAllTime += m.tDone;
      if (m.tDone > 0) activeDays += 1;
      if (d.date >= yearAgoKey && m.tTotal > 0) {
        avgSumPct += (m.tDone / m.tTotal) * 100;
        avgCount += 1;
        weekdayTotals[getDay(new Date(`${d.date}T00:00:00`))] += m.tDone;
      }
    }
    const averageCompletion = avgCount === 0 ? 0 : Math.round(avgSumPct / avgCount);

    // ---- Trend series (weighted ratios per bucket) ----------------------
    const dailySeries = (fromDays: number): TrendPoint[] =>
      eachDayOfInterval({ start: subDays(today, fromDays - 1), end: today }).map(
        (date) => {
          const m = metric(toDateKey(date));
          return {
            key: toDateKey(date),
            label: format(date, fromDays <= 7 ? "EEE" : "d"),
            task: pct(m.tDone, m.tTotal),
            habit: habitCount ? pct(m.hDone, habitCount) : 0,
            focus: pct(m.fDone, m.fTotal),
          };
        },
      );

    const yearSeries: TrendPoint[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const mDate = subMonths(today, i);
      const mStart = startOfMonth(mDate);
      const mEnd = i === 0 ? today : endOfMonth(mDate);
      let tD = 0,
        tT = 0,
        hD = 0,
        fD = 0,
        fT = 0,
        dayN = 0;
      for (const d of eachDayOfInterval({ start: mStart, end: mEnd })) {
        const m = metric(toDateKey(d));
        tD += m.tDone;
        tT += m.tTotal;
        hD += m.hDone;
        fD += m.fDone;
        fT += m.fTotal;
        dayN += 1;
      }
      yearSeries.push({
        key: format(mStart, "yyyy-MM"),
        label: format(mStart, "MMM"),
        task: pct(tD, tT),
        habit: habitCount ? pct(hD, habitCount * dayN) : 0,
        focus: pct(fD, fT),
      });
    }

    const trends: Record<TrendRange, TrendPoint[]> = {
      week: dailySeries(7),
      month: dailySeries(30),
      year: yearSeries,
    };

    // ---- Heatmap (contribution grid) ------------------------------------
    const gridStart = startOfWeek(subDays(today, (HEATMAP_WEEKS - 1) * 7), {
      weekStartsOn: 1,
    });
    const heatmap: HeatCell[][] = [];
    for (let w = 0; w < HEATMAP_WEEKS; w += 1) {
      const col: HeatCell[] = [];
      for (let dow = 0; dow < 7; dow += 1) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + w * 7 + dow);
        const key = toDateKey(date);
        const m = metric(key);
        const prog = dayProgress(m.tTotal, m.tDone);
        col.push({
          key,
          date,
          ratio: prog.ratio,
          status: prog.status,
          total: m.tTotal,
          completed: m.tDone,
        });
      }
      heatmap.push(col);
    }

    // ---- Year in review -------------------------------------------------
    let bestMonth = { label: "—", value: 0 };
    for (const p of yearSeries) {
      // value = completed tasks that month
      let sum = 0;
      const [yy, mm] = p.key.split("-").map(Number);
      const mStart = new Date(yy, mm - 1, 1);
      const mEnd = endOfMonth(mStart);
      for (const d of eachDayOfInterval({ start: mStart, end: mEnd })) {
        sum += metric(toDateKey(d)).tDone;
      }
      if (sum > bestMonth.value) bestMonth = { label: format(mStart, "MMMM"), value: sum };
    }

    const weekdayMaxIdx = weekdayTotals.indexOf(Math.max(...weekdayTotals));
    const mostActiveWeekday = {
      label: weekdayTotals[weekdayMaxIdx] > 0 ? WEEKDAY_NAMES[weekdayMaxIdx] : "—",
      value: weekdayTotals[weekdayMaxIdx],
    };

    // best week by completed tasks
    const weekBuckets = new Map<string, number>();
    for (const d of days) {
      if (d.date < yearAgoKey) continue;
      const ws = toDateKey(startOfWeek(new Date(`${d.date}T00:00:00`), { weekStartsOn: 1 }));
      weekBuckets.set(ws, (weekBuckets.get(ws) ?? 0) + metric(d.date).tDone);
    }
    let bestWeek = { label: "—", value: 0 };
    for (const [ws, v] of weekBuckets) {
      if (v > bestWeek.value) {
        bestWeek = { label: format(new Date(`${ws}T00:00:00`), "MMM d"), value: v };
      }
    }

    // best habit by total completions
    let bestHabit: { name: string; value: number } | null = null;
    for (const h of habitDefs) {
      let count = 0;
      for (const d of days) if (d.habitLog?.[h.id]) count += 1;
      if (!bestHabit || count > bestHabit.value) bestHabit = { name: h.name, value: count };
    }
    if (bestHabit && bestHabit.value === 0) bestHabit = null;

    // ---- Achievements ---------------------------------------------------
    const hasPerfectWeek = (() => {
      // any 7 consecutive complete days
      return longestStreak >= 7;
    })();
    const achievements: Achievement[] = [
      mk("first-week", "First Week", "Stayed active for 7 days", "🌱", activeDays >= 7, activeDays / 7),
      mk("streak-7", "7-Day Streak", "Seven perfect days in a row", "🔥", longestStreak >= 7, longestStreak / 7),
      mk("tasks-100", "100 Tasks", "Completed one hundred tasks", "⭐", tasksAllTime >= 100, tasksAllTime / 100),
      mk("first-month", "First Month", "Active on 28 different days", "📖", activeDays >= 28, activeDays / 28),
      mk("perfect-week", "Perfect Week", "A full week, all complete", "🏆", hasPerfectWeek, longestStreak / 7),
      mk("tasks-1000", "1000 Tasks", "A thousand tasks done", "💎", tasksAllTime >= 1000, tasksAllTime / 1000),
    ];

    // ---- Consistency-weighted score + tree stage -----------------------
    const last7 = eachDayOfInterval({ start: subDays(today, 6), end: today }).map(
      (d) => metric(toDateKey(d)),
    );
    const activeLast7 = last7.filter((m) => m.tTotal > 0 && m.tDone === m.tTotal).length;
    const weekConsistency = (activeLast7 / 7) * 100;
    const habitConsistency =
      habitCount === 0
        ? 0
        : (last7.reduce((s, m) => s + m.hDone, 0) / (habitCount * 7)) * 100;
    const focusTotals = last7.reduce(
      (s, m) => ({ done: s.done + m.fDone, total: s.total + m.fTotal }),
      { done: 0, total: 0 },
    );
    const focusConsistency = pct(focusTotals.done, focusTotals.total);
    const weekPct = pct(wDone, wTotal);

    const score = Math.round(
      Math.min(
        100,
        0.34 * Math.min(currentStreak / 30, 1) * 100 +
          0.24 * weekConsistency +
          0.18 * weekPct +
          0.12 * habitConsistency +
          0.12 * focusConsistency,
      ),
    );

    let stage: TreeStage = 0;
    if (currentStreak >= 30 || (longestStreak >= 30 && score >= 75)) stage = 4;
    else if (currentStreak >= 14 || score >= 60) stage = 3;
    else if (tasksAllTime >= 100) stage = 2;
    else if (activeDays >= 7) stage = 1;
    const stageFloors = [0, 10, 35, 60, 85];
    const nextFloor = stage < 4 ? stageFloors[stage + 1] : 100;
    const curFloor = stageFloors[stage];
    const growth = Math.max(
      0,
      Math.min(1, (score - curFloor) / Math.max(1, nextFloor - curFloor)),
    );

    return {
      todayCompletion: pct(todayM.tDone, todayM.tTotal),
      weekCompletion: weekPct,
      monthProgress: pct(mDone, mTotal),
      currentStreak,
      longestStreak,
      tasksThisWeek,
      tasksAllTime,
      habitsThisWeek,
      averageCompletion,
      activeDays,
      trends,
      heatmap,
      achievements,
      yearInReview: {
        mostProductiveMonth: bestMonth,
        bestHabit,
        averageCompletion,
        longestStreak,
        mostActiveWeekday,
        bestWeek,
      },
      tree: { stage, growth, score },
    };
  }, [days, habitDefs, today]);
}

function mk(
  id: string,
  title: string,
  description: string,
  icon: string,
  unlocked: boolean,
  progress: number,
): Achievement {
  return {
    id,
    title,
    description,
    icon,
    unlocked,
    progress: Math.max(0, Math.min(1, progress)),
  };
}
