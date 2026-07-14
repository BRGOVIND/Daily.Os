import { db, updateDay } from "@/lib/db";
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

  await updateDay(dateKey, (d) => {
    const task = makeTask(draft, d.tasks.length);
    const linked = recurringId ? { ...task, recurringId } : task;
    return {
      ...d,
      tasks: [...d.tasks, linked],
      recurringApplied: recurringId
        ? [...d.recurringApplied, recurringId]
        : d.recurringApplied,
    };
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
