import { getDay, getDate, isBefore, startOfDay } from "date-fns";
import type { RecurrenceRule } from "@/types";

/**
 * Does a recurring task with `rule` (anchored at `anchor`, its creation date)
 * occur on `date`? Occurrences never precede the anchor day.
 */
export function occursOn(
  rule: RecurrenceRule,
  anchor: Date,
  date: Date,
): boolean {
  if (rule === "none") return false;
  const day = startOfDay(date);
  const from = startOfDay(anchor);
  if (isBefore(day, from)) return false;

  const weekday = getDay(day); // 0 = Sunday … 6 = Saturday
  switch (rule) {
    case "daily":
      return true;
    case "weekdays":
      return weekday >= 1 && weekday <= 5;
    case "weekends":
      return weekday === 0 || weekday === 6;
    case "weekly":
      return weekday === getDay(from);
    case "monthly":
      return getDate(day) === getDate(from);
    default:
      return false;
  }
}
