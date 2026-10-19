/**
 * Aggregate report builder — the single entry point that runs every analytics
 * module over one snapshot of the user's data and returns the combined
 * PlanningReport the UI renders. Pure: same input → same output.
 */

import { format, parseISO, subDays } from "date-fns";
import type { EngineInput, PlanningReport } from "@/engine/models/types";
import { flattenTasks } from "@/engine/utils/tasks";
import { priorityDistribution } from "@/engine/prediction/priority";
import { analyzeWorkload } from "@/engine/analytics/workload";
import { computeProductivity } from "@/engine/analytics/productivity";
import { analyzeEnergy } from "@/engine/analytics/energy";
import { detectBurnout } from "@/engine/analytics/burnout";
import { weeklyReview } from "@/engine/analytics/review";
import { missionProgress, missionRecommendations } from "./missions";

export function buildPlanningReport(
  input: EngineInput,
): PlanningReport {
  const { today, days, habits, missions } = input;

  const byDate = new Map(days.map((d) => [d.date, d]));
  const allTasks = flattenTasks(days);

  const key30 = format(subDays(parseISO(today), 30), "yyyy-MM-dd");
  const key14 = format(subDays(parseISO(today), 14), "yyyy-MM-dd");
  const energyTasks = allTasks.filter((t) => t.date >= key30);
  const windowTasks = allTasks.filter((t) => t.date >= key14);

  // Live backlog: incomplete tasks from today onward, plus anything overdue.
  const actionable = allTasks.filter(
    (t) => !t.completed && (t.date >= today || (t.deadline != null && t.deadline < today)),
  );

  const productivity = computeProductivity(today, byDate, habits);
  const workload = analyzeWorkload(today, byDate);
  const energy = analyzeEnergy(energyTasks);
  const burnout = detectBurnout(today, byDate, habits, windowTasks);
  const weeklyReviewReport = weeklyReview(today, byDate, habits, windowTasks);
  const priorityDist = priorityDistribution(actionable, today);

  const activeMissions = missions.filter((m) => !m.archived);
  const missionReports = activeMissions.map((m) =>
    missionProgress(m, allTasks, today),
  );
  const recs = missionRecommendations(missions, allTasks, today);

  return {
    productivity,
    workload,
    energy,
    burnout,
    weeklyReview: weeklyReviewReport,
    priorityDistribution: priorityDist,
    missions: missionReports,
    missionRecommendations: recs,
  };
}
