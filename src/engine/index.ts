/**
 * Intelligence Engine — public API.
 *
 * A self-contained, offline, UI-agnostic domain that turns a snapshot of the
 * user's data (days, habits, missions) into planning, prioritisation and
 * coaching outputs. It depends only on `@/types`, date-fns and its own modules
 * — never on React, Dexie or any component. The UI consumes these outputs; it
 * never reimplements them.
 *
 *   Module 2  Planner .................. buildDayPlan
 *   Module 3  Priority ................. computePriority, priorityDistribution
 *   Module 4  Workload ................. analyzeWorkload
 *   Module 5  Productivity ............. computeProductivity
 *   Module 6  Energy ................... analyzeEnergy
 *   Module 7  Burnout ................. detectBurnout
 *   Module 8  Weekly Coach ............ weeklyCoach
 *   Module 9  Estimation .............. dayWorkloadMinutes, …
 *   Module 10 Mission Mode ............ missionProgress, missionRecommendations
 *   Aggregate ......................... buildIntelligenceReport
 */

// Types
export * from "./models/types";
export {
  DAILY_CAPACITY_MIN,
  WEEKLY_CAPACITY_MIN,
  DEFAULT_ESTIMATE_MIN,
  ANALYSIS_WINDOW_DAYS,
} from "./models/constants";

// Utilities (safe, pure helpers the UI can reuse for labels/formatting)
export {
  DAY_PARTS,
  DAY_PART_LABEL,
  formatHour,
  hourToPart,
} from "./utils/time";
export {
  estMinutes,
  difficultyOf,
  energyOf,
  isOverdue,
  daysUntilDeadline,
  flattenTasks,
} from "./utils/tasks";

// Prediction
export {
  computePriority,
  priorityDistribution,
  scoreToBand,
  PRIORITY_BAND_LABEL,
} from "./prediction/priority";
export {
  dayWorkloadMinutes,
  dayOpenTaskCount,
  tasksWorkloadMinutes,
} from "./prediction/estimation";

// Analytics
export { analyzeWorkload } from "./analytics/workload";
export { computeProductivity } from "./analytics/productivity";
export { analyzeEnergy } from "./analytics/energy";
export { detectBurnout } from "./analytics/burnout";
export { weeklyCoach } from "./analytics/coach";

// Planner
export { buildDayPlan } from "./planner/planner";

// Recommendation / missions
export { missionProgress, missionRecommendations } from "./recommendation/missions";
export { buildIntelligenceReport } from "./recommendation/report";
