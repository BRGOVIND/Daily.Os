/**
 * Module 6 — Energy Analysis.
 *
 * Learns *when* someone actually completes demanding work by bucketing
 * completed tasks by their completion hour, weighted by effort. The Planner
 * consumes the peak window to place hard tasks where the user is at their best.
 */

import type { DatedTask } from "@/engine/models/types";
import type { EnergyInsight, HourBucket } from "@/engine/models/types";
import { DIFFICULTY_WEIGHT } from "@/engine/models/constants";
import {
  DAY_PART_LABEL,
  emptyByPart,
  formatHour,
  hourToPart,
} from "@/engine/utils/time";
import {
  completionHour,
  difficultyOf,
  energyOf,
} from "@/engine/utils/tasks";

const MIN_SAMPLES = 6;

/** Whether a task is "hard" for the purposes of peak-window detection. */
function isHard(task: DatedTask): boolean {
  return difficultyOf(task) === "hard" || energyOf(task) === "high";
}

export function analyzeEnergy(tasks: DatedTask[]): EnergyInsight {
  const hours: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    completions: 0,
    hardCompletions: 0,
    weightedEffort: 0,
  }));
  const byPart = emptyByPart();
  let samples = 0;

  for (const task of tasks) {
    const hour = completionHour(task);
    if (hour === null) continue;
    samples += 1;
    const weight = DIFFICULTY_WEIGHT[difficultyOf(task)];
    const bucket = hours[hour];
    bucket.completions += 1;
    bucket.weightedEffort += weight;
    if (isHard(task)) bucket.hardCompletions += 1;
    byPart[hourToPart(hour)] += weight;
  }

  if (samples < MIN_SAMPLES) {
    return {
      hours,
      peakWindow: null,
      peakPart: null,
      headline:
        "Not enough completed tasks yet to map your energy — keep logging and this will sharpen.",
      byPart,
      hasData: false,
    };
  }

  // Find the best 3-hour contiguous window by hard-weighted effort.
  let bestStart = 0;
  let bestValue = -1;
  for (let start = 0; start < 24; start += 1) {
    let value = 0;
    for (let k = 0; k < 3; k += 1) {
      const h = hours[(start + k) % 24];
      value += h.hardCompletions * 2 + h.weightedEffort;
    }
    if (value > bestValue) {
      bestValue = value;
      bestStart = start;
    }
  }

  const startHour = bestStart;
  const endHour = (bestStart + 2) % 24;
  const peakPart = hourToPart(startHour);
  const headline =
    bestValue > 0
      ? `You complete demanding work most consistently between ${formatHour(
          startHour,
        )} and ${formatHour((endHour + 1) % 24)}.`
      : `Your work tends to land in the ${DAY_PART_LABEL[peakPart].toLowerCase()}.`;

  return {
    hours,
    peakWindow: { startHour, endHour },
    peakPart,
    headline,
    byPart,
    hasData: true,
  };
}
