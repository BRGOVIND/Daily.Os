import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { DATE_KEY_FORMAT } from "@/lib/constants";

export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Serialize a Date to the canonical day key (yyyy-MM-dd). */
export function toDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT);
}

/** Parse a canonical day key back into a local Date. */
export function fromDateKey(key: string): Date {
  return parseISO(key);
}

export interface CalendarCell {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
}

/**
 * Build the 6-week (42 cell) grid for a month, week starting Monday, so the
 * calendar height stays stable across month transitions.
 */
export function buildMonthGrid(month: Date): CalendarCell[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((date) => ({
    date,
    key: toDateKey(date),
    inMonth: isSameMonth(date, month),
    isToday: isToday(date),
  }));
}

export function formatMonthTitle(month: Date): string {
  return format(month, "MMMM yyyy");
}

/** Normalize any date to the first of its month (calendar navigation anchor). */
export function startOfMonthOf(date: Date): Date {
  return startOfMonth(date);
}

/** The date-key for the day after the given key. */
export function nextDayKey(key: string): string {
  return toDateKey(addDays(fromDateKey(key), 1));
}

/** Long, human date for the review header, e.g. "Monday, 12 July". */
export function formatLongDate(date: Date): string {
  return format(date, "EEEE, d MMMM");
}

export { addDays };

/** e.g. "Monday" / "July 12" for the day modal header. */
export function formatDayHeader(date: Date): { weekday: string; date: string } {
  return {
    weekday: format(date, "EEEE"),
    date: format(date, "MMMM d"),
  };
}

export { addMonths, subMonths, isSameDay, isToday, isSameMonth };
