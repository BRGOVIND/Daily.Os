import { createId } from "@/lib/utils";
import type {
  RecurringTask,
  Task,
  TaskDraft,
  TemplateItem,
} from "@/types";

/**
 * Single source of truth for turning a form draft into a persisted Task.
 * Used by the quick-add, the floating composer, templates and recurrence so
 * task shape never drifts between entry points.
 */
export function makeTask(draft: TaskDraft, order: number): Task {
  return {
    id: createId(),
    title: draft.title.trim(),
    completed: false,
    priority: draft.priority,
    category: draft.category,
    color: draft.color,
    notes: draft.notes.trim(),
    recurrence: draft.recurrence,
    recurringId: null,
    reminderAt: draft.reminderAt,
    order,
    createdAt: Date.now(),
  };
}

/** Build a task from a template line item. */
export function taskFromTemplateItem(item: TemplateItem, order: number): Task {
  return {
    id: createId(),
    title: item.title,
    completed: false,
    priority: item.priority,
    category: item.category,
    color: item.color,
    notes: "",
    recurrence: "none",
    recurringId: null,
    reminderAt: null,
    order,
    createdAt: Date.now(),
  };
}

/** Build a materialized instance of a recurring task for a given day. */
export function taskFromRecurring(rec: RecurringTask, order: number): Task {
  return {
    id: createId(),
    title: rec.title,
    completed: false,
    priority: rec.priority,
    category: rec.category,
    color: rec.color,
    notes: rec.notes,
    recurrence: rec.rule,
    recurringId: rec.id,
    reminderAt: null,
    order,
    createdAt: Date.now(),
  };
}
