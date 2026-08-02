/**
 * Module 10 — Mission Mode analytics.
 *
 * Derives live progress and pace for each mission from its milestones and the
 * tasks linked to it, and turns active missions into concrete daily
 * recommendations the Planner can surface.
 */

import { differenceInCalendarDays, parseISO } from "date-fns";
import type { Milestone, Mission } from "@/types";
import type { DatedTask } from "@/engine/models/types";
import type {
  MissionProgress,
  MissionRecommendation,
  MissionPace,
} from "@/engine/models/types";
import { clamp01, round } from "@/engine/utils/math";

function nextMilestone(milestones: Milestone[]): Milestone | null {
  const pending = milestones.filter((m) => !m.done);
  if (pending.length === 0) return null;
  return [...pending].sort((a, b) => {
    if (a.targetDate && b.targetDate) return a.targetDate < b.targetDate ? -1 : 1;
    if (a.targetDate) return -1;
    if (b.targetDate) return 1;
    return 0;
  })[0];
}

function paceFor(overall: number, timeRatio: number | null): MissionPace {
  if (timeRatio === null) return "unknown";
  if (overall >= 0.999) return "on-track";
  if (overall >= timeRatio + 0.1) return "ahead";
  if (overall >= timeRatio - 0.1) return "on-track";
  return "behind";
}

export function missionProgress(
  mission: Mission,
  tasks: DatedTask[],
  today: string,
): MissionProgress {
  const linked = tasks.filter((t) => t.missionId === mission.id);
  const completedTaskCount = linked.filter((t) => t.completed).length;
  const activeTaskCount = linked.length - completedTaskCount;

  const totalMilestones = mission.milestones.length;
  const doneMilestones = mission.milestones.filter((m) => m.done).length;
  const milestoneRatio = totalMilestones === 0 ? 0 : doneMilestones / totalMilestones;
  const taskRatio = linked.length === 0 ? 0 : completedTaskCount / linked.length;

  let overall: number;
  if (totalMilestones > 0 && linked.length > 0) {
    overall = milestoneRatio * 0.6 + taskRatio * 0.4;
  } else if (totalMilestones > 0) {
    overall = milestoneRatio;
  } else {
    overall = taskRatio;
  }

  const daysElapsed = Math.max(
    0,
    differenceInCalendarDays(parseISO(today), parseISO(mission.startDate)),
  );
  const daysTotal = mission.targetDate
    ? Math.max(
        1,
        differenceInCalendarDays(
          parseISO(mission.targetDate),
          parseISO(mission.startDate),
        ),
      )
    : null;
  const timeRatio = daysTotal === null ? null : clamp01(daysElapsed / daysTotal);

  return {
    missionId: mission.id,
    title: mission.title,
    icon: mission.icon,
    milestoneRatio: round(milestoneRatio, 2),
    taskRatio: round(taskRatio, 2),
    overall: round(clamp01(overall), 2),
    daysElapsed,
    daysTotal,
    timeRatio: timeRatio === null ? null : round(timeRatio, 2),
    pace: paceFor(overall, timeRatio),
    activeTaskCount,
    completedTaskCount,
    nextMilestone: nextMilestone(mission.milestones),
  };
}

/**
 * Turn active missions into at most `limit` daily recommendations, favouring
 * missions that are behind pace or have open work.
 */
export function missionRecommendations(
  missions: Mission[],
  tasks: DatedTask[],
  today: string,
  limit = 3,
): MissionRecommendation[] {
  const active = missions.filter((m) => !m.archived);
  const scored = active.map((mission) => {
    const progress = missionProgress(mission, tasks, today);
    const openTasks = tasks.filter(
      (t) => t.missionId === mission.id && !t.completed,
    );
    let suggestion: string;
    if (openTasks.length > 0) {
      suggestion = `Continue "${openTasks[0].title}".`;
    } else if (progress.nextMilestone) {
      suggestion = `Add a task toward "${progress.nextMilestone.title}".`;
    } else if (progress.overall >= 1) {
      suggestion = "All milestones done — set the next one.";
    } else {
      suggestion = "Break this mission into a first task.";
    }
    // Rank: behind pace first, then least overall progress.
    const urgency =
      (progress.pace === "behind" ? 2 : progress.pace === "unknown" ? 1 : 0) +
      (1 - progress.overall);
    return { mission, progress, suggestion, urgency };
  });

  return scored
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, limit)
    .map(({ mission, suggestion }) => ({
      missionId: mission.id,
      missionTitle: mission.title,
      icon: mission.icon,
      suggestion,
    }));
}
