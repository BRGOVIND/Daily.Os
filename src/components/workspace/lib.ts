import { fromDateKey } from "@/lib/date";
import { format, isToday, isYesterday } from "date-fns";

/** Minutes → "45m" / "2h 30m" / "3h". */
export function formatMinutes(min: number): string {
  if (min <= 0) return "0m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** A friendly relative label for a day key: Today / Yesterday / "Mon, 12 Jul". */
export function relativeDay(key: string): string {
  const d = fromDateKey(key);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, d MMM");
}

/** A short absolute label for a day key: "12 Jul". */
export function shortDay(key: string): string {
  return format(fromDateKey(key), "d MMM");
}
