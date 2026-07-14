"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Task } from "@/types";

export interface SearchResult {
  date: string;
  task: Task;
}

const MAX_RESULTS = 40;

/**
 * Instant, in-memory search across every day's tasks. Matches title, notes and
 * category (case-insensitive). Results are date-descending, capped for speed.
 */
export function useSearch(query: string): {
  results: SearchResult[];
  totalDays: number;
} {
  const days = useLiveQuery(() => db.days.toArray(), []);

  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!days || q.length === 0) return { results: [], totalDays: days?.length ?? 0 };

    const matches: SearchResult[] = [];
    // Newest days first.
    const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1));

    for (const day of sorted) {
      for (const task of day.tasks) {
        const haystack =
          `${task.title} ${task.notes} ${task.category}`.toLowerCase();
        if (haystack.includes(q)) {
          matches.push({ date: day.date, task });
          if (matches.length >= MAX_RESULTS) return { results: matches, totalDays: days.length };
        }
      }
    }
    return { results: matches, totalDays: days.length };
  }, [days, query]);
}
