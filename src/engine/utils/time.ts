/** Time-of-day helpers for the Planner and energy analysis. */

import type { DayPart } from "@/types";
import { DAY_PART_HOURS } from "@/engine/models/constants";

export const DAY_PARTS: DayPart[] = ["morning", "afternoon", "evening", "night"];

export const DAY_PART_LABEL: Record<DayPart, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

/** Map a 0..23 local hour to the part of day it belongs to. */
export function hourToPart(hour: number): DayPart {
  const h = ((hour % 24) + 24) % 24;
  if (h >= DAY_PART_HOURS.morning[0] && h <= DAY_PART_HOURS.morning[1]) {
    return "morning";
  }
  if (h >= DAY_PART_HOURS.afternoon[0] && h <= DAY_PART_HOURS.afternoon[1]) {
    return "afternoon";
  }
  if (h >= DAY_PART_HOURS.evening[0] && h <= DAY_PART_HOURS.evening[1]) {
    return "evening";
  }
  return "night"; // 21..23 and 0..4
}

/** Format a 24h hour as a compact 12h label, e.g. 8 → "8 AM", 14 → "2 PM". */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  const period = h < 12 ? "AM" : "PM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${period}`;
}

/** Zeroed effort-per-part accumulator. */
export function emptyByPart(): Record<DayPart, number> {
  return { morning: 0, afternoon: 0, evening: 0, night: 0 };
}
