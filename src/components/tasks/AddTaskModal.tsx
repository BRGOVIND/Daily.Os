"use client";

import { Modal } from "@/components/ui/modal";
import { TaskForm } from "./TaskForm";
import { fromDateKey, formatDayHeader } from "@/lib/date";
import type { Mission, TaskDraft, Template } from "@/types";

interface AddTaskModalProps {
  open: boolean;
  dateKey: string | null;
  templates: Template[];
  missions?: Mission[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (draft: TaskDraft) => void | Promise<void>;
  onUseTemplate: (template: Template) => void | Promise<void>;
}

/** Centered, animated task composer bound to a specific day. */
export function AddTaskModal({
  open,
  dateKey,
  templates,
  missions,
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
        missions={missions}
        onUseTemplate={async (t) => {
          await onUseTemplate(t);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
        onSubmit={async (draft) => {
          await onSubmit(draft);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}
