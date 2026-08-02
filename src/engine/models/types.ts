/**
 * Output shapes produced by the Intelligence Engine and consumed by the UI.
 *
 * The UI never recomputes any of this — it renders these structures. Keeping
 * them in one file makes the engine's public surface easy to read.
 */

import type { DayPart, Mission, Milestone, Task } from "@/types";

/** A task paired with the day it belongs to — the engine's working unit. */
export interface DatedTask extends Task {
  date: string;
}

// ─── Priority (Module 3) ─────────────────────────────────────────────────────

export type PriorityBand = "low" | "medium" | "high" | "critical";

export interface PriorityFactors {
  deadline: number;
  manual: number;
  difficulty: number;
  deferrals: number;
  duration: number;
  recurrence: number;
  category: number;
}

export interface PriorityBreakdown {
  /** 0..100 calculated priority. */
  score: number;
  band: PriorityBand;
  /** Per-factor normalized contributions (0..1). */
  factors: PriorityFactors;
  /** Human-readable reasons, most significant first. */
  reasons: string[];
}

export interface PriorityDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
  total: number;
}

// ─── Workload (Module 4 / 9) ─────────────────────────────────────────────────

export type WorkloadStatus = "light" | "balanced" | "heavy" | "overloaded";

export interface WorkloadBucket {
  label: string;
  minutes: number;
  taskCount: number;
  capacityMinutes: number;
  /** minutes / capacity. */
  ratio: number;
  overloaded: boolean;
}

export interface MoveSuggestion {
  taskId: string;
  title: string;
  fromDate: string;
  toDate: string;
  minutes: number;
  reason: string;
}

export interface WorkloadReport {
  today: WorkloadBucket;
  tomorrow: WorkloadBucket;
  week: WorkloadBucket;
  status: WorkloadStatus;
  suggestions: MoveSuggestion[];
  /** True when today's committed work exceeds a full day's capacity. */
  impossibleToday: boolean;
}

// ─── Productivity score (Module 5) ───────────────────────────────────────────

export type ProductivityBand = "struggling" | "building" | "steady" | "thriving";

export interface ScoreComponent {
  key: string;
  label: string;
  /** 0..100. */
  value: number;
  weight: number;
  /** value * weight, i.e. points contributed to the final score. */
  contribution: number;
}

export interface ProductivityScore {
  score: number;
  band: ProductivityBand;
  components: ScoreComponent[];
  /** Change vs the previous window (percentage points). */
  delta: number;
  /** Plain-language explanation of what moved the score. */
  reasons: string[];
}

// ─── Energy analysis (Module 6) ──────────────────────────────────────────────

export interface HourBucket {
  hour: number; // 0..23
  completions: number;
  hardCompletions: number;
  weightedEffort: number;
}

export interface EnergyInsight {
  hours: HourBucket[];
  /** Inclusive local-hour window where hard work concentrates, or null. */
  peakWindow: { startHour: number; endHour: number } | null;
  /** Part of day the peak window falls in, or null. */
  peakPart: DayPart | null;
  headline: string;
  /** Total weighted effort per day-part. */
  byPart: Record<DayPart, number>;
  hasData: boolean;
}

// ─── Burnout detection (Module 7) ────────────────────────────────────────────

export type BurnoutRisk = "none" | "low" | "elevated" | "high";

export interface BurnoutSignal {
  key: string;
  label: string;
  detail: string;
  /** 0..1 severity of this individual signal. */
  severity: number;
}

export interface BurnoutReport {
  risk: BurnoutRisk;
  /** 0..100 composite. */
  score: number;
  signals: BurnoutSignal[];
  suggestions: string[];
}

// ─── Weekly coach (Module 8) ─────────────────────────────────────────────────

export interface CoachInsight {
  key: string;
  icon: string;
  title: string;
  detail: string;
}

export interface WeeklyCoachReport {
  weekLabel: string;
  insights: CoachInsight[];
  /** Completed-task change vs the previous week (percent). */
  improvement: number;
  hasData: boolean;
}

// ─── Planner (Module 2) ──────────────────────────────────────────────────────

export type PlanItemSource = "task" | "habit" | "ritual";

export interface PlanItem {
  id: string;
  title: string;
  part: DayPart;
  source: PlanItemSource;
  reason: string;
  estimatedMinutes: number;
  priorityBand: PriorityBand | null;
  /** Present when source === "task". */
  taskId: string | null;
}

export interface PlanSection {
  part: DayPart;
  label: string;
  items: PlanItem[];
  totalMinutes: number;
}

export interface DayPlan {
  date: string;
  sections: PlanSection[];
  totalMinutes: number;
  /** Advisory notes (overload warnings, overdue counts, etc.). */
  notes: string[];
  hasWork: boolean;
}

// ─── Mission Mode (Module 10) ────────────────────────────────────────────────

export type MissionPace = "ahead" | "on-track" | "behind" | "unknown";

export interface MissionProgress {
  missionId: string;
  title: string;
  icon: string;
  /** 0..1 milestones completed. */
  milestoneRatio: number;
  /** 0..1 linked tasks completed. */
  taskRatio: number;
  /** 0..1 blended progress shown on the card. */
  overall: number;
  daysElapsed: number;
  daysTotal: number | null;
  /** 0..1 elapsed time toward target, or null when open-ended. */
  timeRatio: number | null;
  pace: MissionPace;
  activeTaskCount: number;
  completedTaskCount: number;
  nextMilestone: Milestone | null;
}

/** A recommended next action toward a mission (surfaced in the planner). */
export interface MissionRecommendation {
  missionId: string;
  missionTitle: string;
  icon: string;
  suggestion: string;
}

// ─── Aggregate report ────────────────────────────────────────────────────────

export interface IntelligenceReport {
  productivity: ProductivityScore;
  workload: WorkloadReport;
  energy: EnergyInsight;
  burnout: BurnoutReport;
  coach: WeeklyCoachReport;
  priorityDistribution: PriorityDistribution;
  missions: MissionProgress[];
  missionRecommendations: MissionRecommendation[];
}

/** Everything the engine needs to produce a full report. */
export interface EngineInput {
  today: string;
  days: import("@/types").DayRecord[];
  habits: import("@/types").HabitDef[];
  missions: Mission[];
}
