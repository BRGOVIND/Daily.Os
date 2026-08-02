/**
 * Journal helpers — streaks, mood averages and ordering over structured daily
 * entries (mood, highlights, challenges, lessons, reflection).
 */

import type { JournalEntry } from "@/types";
import { MOOD_MAP } from "@/lib/constants";
import { fromDateKey, toDateKey } from "@/lib/date";
import { addDays } from "date-fns";

/** Newest entry first. */
export function sortJournal(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** True if an entry has any substantive content. */
export function hasContent(entry: JournalEntry): boolean {
  return (
    entry.mood !== null ||
    [entry.highlights, entry.challenges, entry.lessons, entry.reflection].some(
      (s) => s.trim().length > 0,
    )
  );
}

/**
 * The current journalling streak ending today (or yesterday): consecutive days
 * with a content-bearing entry. `todayKey` anchors the count.
 */
export function journalStreak(entries: JournalEntry[], todayKey: string): number {
  const days = new Set(entries.filter(hasContent).map((e) => e.date));
  if (days.size === 0) return 0;

  let streak = 0;
  let cursor = fromDateKey(todayKey);
  // Allow the streak to still count if today isn't journalled yet but yesterday is.
  if (!days.has(toDateKey(cursor))) cursor = addDays(cursor, -1);
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Average mood score (1–5) across entries that recorded a mood, or null. */
export function moodAverage(entries: JournalEntry[]): number | null {
  const scored = entries
    .filter((e) => e.mood !== null)
    .map((e) => MOOD_MAP[e.mood as NonNullable<JournalEntry["mood"]>].score);
  if (scored.length === 0) return null;
  return scored.reduce((a, b) => a + b, 0) / scored.length;
}
