/**
 * Headless render smoke test for the Stats visualizations. The production build
 * only ever prerenders AppShell's skeleton branch, so a render-time crash in a
 * chart (e.g. on a fresh user's empty data) is invisible to `next build`. This
 * renders each child directly to static markup to catch such crashes.
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Overview } from "./Overview";
import { TrendChart } from "./TrendChart";
import { StatsHeatmap } from "./StatsHeatmap";
import { Achievements } from "./Achievements";
import { YearInReview } from "./YearInReview";
import { GrowthTree } from "./GrowthTree";
import type {
  Achievement,
  HeatCell,
  JournalStats,
  TrendPoint,
  TrendRange,
} from "@/hooks/useJournalStats";

function trendSeries(n: number, value: number): TrendPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    label: `${i}`,
    key: `2026-01-${(i % 28) + 1}`,
    task: value,
    habit: value,
    focus: value,
  }));
}

function heatmap(fill: number): HeatCell[][] {
  return Array.from({ length: 26 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => ({
      key: `w${w}d${d}`,
      date: new Date(2026, 0, 1 + w * 7 + d),
      ratio: fill,
      status: (fill === 0 ? "empty" : fill < 1 ? "partial" : "complete") as HeatCell["status"],
      total: fill === 0 ? 0 : 4,
      completed: Math.round(fill * 4),
    })),
  );
}

function achievements(progress: number): Achievement[] {
  return ["First day", "Week streak", "Century"].map((title, i) => ({
    id: `a${i}`,
    title,
    description: "Keep going.",
    icon: "star",
    unlocked: progress >= 1,
    progress,
  }));
}

function makeStats(v: number): JournalStats {
  return {
    todayCompletion: v * 100,
    weekCompletion: v * 100,
    monthProgress: v * 100,
    currentStreak: Math.round(v * 5),
    longestStreak: Math.round(v * 10),
    tasksThisWeek: Math.round(v * 20),
    tasksAllTime: Math.round(v * 200),
    habitsThisWeek: Math.round(v * 10),
    averageCompletion: v * 100,
    activeDays: Math.round(v * 100),
    trends: {
      week: trendSeries(7, v * 100),
      month: trendSeries(30, v * 100),
      year: trendSeries(12, v * 100),
    } as Record<TrendRange, TrendPoint[]>,
    heatmap: heatmap(v),
    achievements: achievements(v),
    yearInReview: {
      mostProductiveMonth: { label: v === 0 ? "—" : "March", value: Math.round(v * 120) },
      bestHabit: v === 0 ? null : { name: "Gym", value: Math.round(v * 30) },
      averageCompletion: v * 100,
      longestStreak: Math.round(v * 10),
      mostActiveWeekday: { label: v === 0 ? "—" : "Mon", value: Math.round(v * 40) },
      bestWeek: { label: v === 0 ? "—" : "Week 12", value: Math.round(v * 35) },
    },
    tree: { stage: (Math.min(4, Math.round(v * 4)) as JournalStats["tree"]["stage"]), growth: v, score: v * 100 },
  };
}

const ACCENT = "#8C1232";
const noop = () => {};

// Render every chart for both a fresh user (v=0, all empty) and an active
// user (v=1). Any thrown error fails the test with the component name.
for (const [label, v] of [["fresh user (empty data)", 0], ["active user", 1]] as const) {
  describe(`Stats renders — ${label}`, () => {
    const stats = makeStats(v);

    it("Overview", () => {
      expect(() =>
        renderToStaticMarkup(createElement(Overview, { stats, accentHex: ACCENT })),
      ).not.toThrow();
    });
    it("TrendChart", () => {
      expect(() =>
        renderToStaticMarkup(createElement(TrendChart, { trends: stats.trends, accentHex: ACCENT })),
      ).not.toThrow();
    });
    it("StatsHeatmap", () => {
      expect(() =>
        renderToStaticMarkup(createElement(StatsHeatmap, { heatmap: stats.heatmap, onSelectDay: noop })),
      ).not.toThrow();
    });
    it("Achievements", () => {
      expect(() =>
        renderToStaticMarkup(createElement(Achievements, { achievements: stats.achievements })),
      ).not.toThrow();
    });
    it("YearInReview", () => {
      expect(() =>
        renderToStaticMarkup(createElement(YearInReview, { review: stats.yearInReview })),
      ).not.toThrow();
    });
    it("GrowthTree", () => {
      expect(() =>
        renderToStaticMarkup(createElement(GrowthTree, { stats })),
      ).not.toThrow();
    });
  });
}
