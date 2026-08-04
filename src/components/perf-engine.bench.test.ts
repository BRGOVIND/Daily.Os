/**
 * CPU benchmark for the heaviest PURE computations that run when data-heavy
 * surfaces open. Pure JS → hardware-representative (absolute ms vary by machine,
 * but order-of-magnitude and scaling with dataset size are the real signal).
 *
 * Measures median wall time of:
 *   1. buildIntelligenceReport  — runs on Stats + Missions open (full day scan)
 *   2. computePriority (bulk)   — the per-TaskItem engine call, times N tasks
 *
 * Not a pass/fail gate on timing (that would be flaky across machines); it
 * asserts only that the functions run, and PRINTS the numbers as evidence.
 */
import { describe, expect, it } from "vitest";
import { buildIntelligenceReport, computePriority } from "@/engine";
import type { DayRecord, HabitDef, Mission, Task } from "@/types";

function key(offsetFromToday: number): string {
  // Deterministic date keys walking backwards from a fixed anchor (no Date.now
  // — banned in this env, and determinism keeps runs comparable).
  const base = new Date(Date.UTC(2026, 0, 1));
  base.setUTCDate(base.getUTCDate() - offsetFromToday);
  return base.toISOString().slice(0, 10);
}

function makeTasks(dayIdx: number, n: number): Task[] {
  const tasks: Task[] = [];
  for (let i = 0; i < n; i++) {
    const completed = (dayIdx + i) % 3 !== 0; // ~66% done
    tasks.push({
      id: `t-${dayIdx}-${i}`,
      title: `Task ${i} on day ${dayIdx}`,
      completed,
      priority: (["low", "medium", "high"] as const)[i % 3],
      category: ["Work", "Health", "Home"][i % 3],
      color: (["burgundy", "sage", "ochre"] as const)[i % 3] as Task["color"],
      notes: "",
      recurrence: "none",
      recurringId: null,
      reminderAt: null,
      order: i,
      createdAt: 0,
      estimatedMinutes: 15 + (i % 4) * 15,
      deadline: i % 5 === 0 ? key(dayIdx - 2) : null,
    } as Task);
  }
  return tasks;
}

function buildDataset(days: number, habits: number, tasksPerDay: number) {
  const habitDefs: HabitDef[] = Array.from({ length: habits }, (_, i) => ({
    id: `h-${i}`,
    name: `Habit ${i}`,
    color: "sage" as HabitDef["color"],
    order: i,
    createdAt: 0,
  }));

  const dayRecords: DayRecord[] = [];
  for (let d = 0; d < days; d++) {
    const habitLog: Record<string, boolean> = {};
    for (const h of habitDefs) habitLog[h.id] = (d + Number(h.id.slice(2))) % 2 === 0;
    dayRecords.push({
      date: key(d),
      tasks: makeTasks(d, tasksPerDay),
      notes: "",
      focus: [
        { id: `f-${d}-0`, title: "Focus A", done: d % 2 === 0 },
        { id: `f-${d}-1`, title: "Focus B", done: d % 3 === 0 },
      ],
      habitLog,
      recurringApplied: [],
      review: null,
      updatedAt: 0,
    });
  }

  const missions: Mission[] = Array.from({ length: 5 }, (_, i) => ({
    id: `m-${i}`,
    title: `Mission ${i}`,
    description: "",
    category: "Work",
    color: "burgundy" as Mission["color"],
    icon: "🎯",
    startDate: key(days - 1),
    targetDate: key(0),
    milestones: [],
    habitIds: habitDefs.slice(0, 2).map((h) => h.id),
    archived: false,
    createdAt: 0,
    updatedAt: 0,
  }));

  return { dayRecords, habitDefs, missions };
}

function median(runs: number[]): number {
  const s = [...runs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function timeIt(label: string, fn: () => void, iterations = 7): number {
  // one warmup for JIT
  fn();
  const runs: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    runs.push(performance.now() - t0);
  }
  const med = median(runs);
  // eslint-disable-next-line no-console
  console.log(`BENCH ${label}: median=${med.toFixed(2)}ms min=${Math.min(...runs).toFixed(2)}ms max=${Math.max(...runs).toFixed(2)}ms`);
  return med;
}

describe("engine CPU benchmark (evidence, not a timing gate)", () => {
  it("buildIntelligenceReport scales across dataset sizes", () => {
    for (const days of [90, 365, 1095]) {
      const { dayRecords, habitDefs, missions } = buildDataset(days, 8, 12);
      const totalTasks = days * 12;
      timeIt(
        `buildIntelligenceReport days=${days} tasks=${totalTasks}`,
        () => {
          const report = buildIntelligenceReport({
            today: key(0),
            days: dayRecords,
            habits: habitDefs,
            missions,
          });
          expect(report).toBeTruthy();
        },
      );
    }
  });

  it("computePriority bulk over a day's tasks", () => {
    const today = key(0);
    for (const n of [20, 50, 100]) {
      const tasks = makeTasks(0, n);
      timeIt(`computePriority x${n} tasks`, () => {
        for (const t of tasks) computePriority(t, today);
      });
    }
  });
});
