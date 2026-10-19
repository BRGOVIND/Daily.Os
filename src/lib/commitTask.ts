import { db, emptyDay, updateDay } from "@/lib/db";
import { createId } from "@/lib/utils";
import { makeTask, taskFromTemplateItem } from "@/lib/tasks";
import type { TaskDraft, Template } from "@/types";

/**
 * Persist a task to a day. If the draft is recurring, also create a global
 * RecurringTask definition and link the materialized instance so future
 * matching days inherit it — the single write path for both entry points.
 */
export async function commitTask(
  dateKey: string,
  draft: TaskDraft,
): Promise<void> {
  await db.transaction("rw", db.recurring, db.days, async () => {
    let recurringId: string | null = null;
    if (draft.recurrence !== "none") {
      recurringId = createId();
      await db.recurring.add({
        id: recurringId,
        title: draft.title.trim(),
        category: draft.category,
        priority: draft.priority,
        color: draft.color,
        notes: draft.notes.trim(),
        rule: draft.recurrence,
        createdAt: Date.now(),
      });
    }

    const day = (await db.days.get(dateKey)) ?? emptyDay(dateKey);
    const task = makeTask(draft, day.tasks.length);
    await db.days.put({
      ...day,
      tasks: [...day.tasks, recurringId ? { ...task, recurringId } : task],
      recurringApplied: recurringId
        ? [...day.recurringApplied, recurringId]
        : day.recurringApplied,
      updatedAt: Date.now(),
    });
  });
}

/** Append every item of a template to a day as fresh tasks. */
export async function applyTemplateToDay(
  dateKey: string,
  template: Template,
): Promise<void> {
  await updateDay(dateKey, (d) => {
    const base = d.tasks.length;
    const added = template.items.map((item, i) =>
      taskFromTemplateItem(item, base + i),
    );
    return { ...d, tasks: [...d.tasks, ...added] };
  });
}
