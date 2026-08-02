import { db, updateDay } from "@/lib/db";
import { createId } from "@/lib/utils";
import { taskFromTemplateItem } from "@/lib/tasks";
import { materializeRecurring } from "@/lib/recurringApply";
import type { DayTemplateDef } from "@/lib/constants";
import type { RecurrenceRule } from "@/types";

/** Drop a day-template's tasks onto a single day, once. */
export async function applyDayTemplateOnce(
  dateKey: string,
  def: DayTemplateDef,
): Promise<void> {
  await updateDay(dateKey, (d) => {
    const base = d.tasks.length;
    const added = def.items.map((item, i) => taskFromTemplateItem(item, base + i));
    return { ...d, tasks: [...d.tasks, ...added] };
  });
}

/**
 * Turn a day-template into a recurring routine: create a RecurringTask
 * definition per item under `rule`, then materialize the ones due on `dateKey`
 * so the effect is visible immediately.
 */
export async function applyDayTemplateRecurring(
  dateKey: string,
  def: DayTemplateDef,
  rule: RecurrenceRule,
): Promise<void> {
  if (rule === "none") {
    await applyDayTemplateOnce(dateKey, def);
    return;
  }
  const now = Date.now();
  await db.recurring.bulkAdd(
    def.items.map((item) => ({
      id: createId(),
      title: item.title,
      category: item.category,
      priority: item.priority,
      color: item.color,
      notes: "",
      rule,
      createdAt: now,
    })),
  );
  await materializeRecurring(dateKey);
}
