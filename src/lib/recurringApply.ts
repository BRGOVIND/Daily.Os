import { db, emptyDay } from "@/lib/db";
import { fromDateKey } from "@/lib/date";
import { occursOn } from "@/lib/recurrence";
import { taskFromRecurring } from "@/lib/tasks";

/**
 * Materialize any recurring tasks that belong on `dateKey` and haven't been
 * applied yet. Idempotent and write-free when there is nothing to add, so it
 * is safe to call every time a day is opened.
 */
export async function materializeRecurring(dateKey: string): Promise<void> {
  const recs = await db.recurring.toArray();
  if (recs.length === 0) return;

  const date = fromDateKey(dateKey);

  await db.transaction("rw", db.days, async () => {
    const day = (await db.days.get(dateKey)) ?? emptyDay(dateKey);
    const applied = new Set(day.recurringApplied);
    let tasks = day.tasks;
    let changed = false;

    for (const rec of recs) {
      if (applied.has(rec.id)) continue;
      if (!occursOn(rec.rule, new Date(rec.createdAt), date)) continue;
      tasks = [...tasks, taskFromRecurring(rec, tasks.length)];
      applied.add(rec.id);
      changed = true;
    }

    if (!changed) return;
    await db.days.put({
      ...day,
      tasks,
      recurringApplied: [...applied],
      updatedAt: Date.now(),
    });
  });
}
