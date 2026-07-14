"use client";

import { Modal } from "@/components/ui/modal";
import { TaskForm } from "./TaskForm";
import { fromDateKey, formatDayHeader } from "@/lib/date";
import type { TaskDraft, Template } from "@/types";

interface AddTaskModalProps {
  open: boolean;
  dateKey: string | null;
  templates: Template[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: TaskDraft) => void;
  onUseTemplate: (template: Template) => void;
}

/** Centered, animated task composer bound to a specific day. */
export function AddTaskModal({
  open,
  dateKey,
  templates,
  onOpenChange,
  onSubmit,
  onUseTemplate,
}: AddTaskModalProps) {
  const targetDate = dateKey ? fromDateKey(dateKey) : new Date();
  const label = dateKey
    ? (() => {
        const { weekday, date } = formatDayHeader(targetDate);
        return `${weekday}, ${date}`;
      })()
    : "today";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add task"
      variant="center"
    >
      <TaskForm
        dateLabel={label}
        targetDate={targetDate}
        templates={templates}
        onUseTemplate={(t) => {
          onUseTemplate(t);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
        onSubmit={(draft) => {
          onSubmit(draft);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}
