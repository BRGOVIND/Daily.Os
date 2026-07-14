"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Bell, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CATEGORIES,
  PRIORITIES,
  RECURRENCE_OPTIONS,
  REMINDER_OPTIONS,
  TASK_COLORS,
} from "@/lib/constants";
import type {
  Priority,
  RecurrenceRule,
  TaskColor,
  TaskDraft,
  Template,
} from "@/types";

interface TaskFormProps {
  onSubmit: (draft: TaskDraft) => void;
  onCancel: () => void;
  onUseTemplate: (template: Template) => void;
  templates: Template[];
  dateLabel: string;
  targetDate: Date;
}

const DEFAULTS: TaskDraft = {
  title: "",
  category: CATEGORIES[0],
  priority: "medium",
  color: "burgundy",
  notes: "",
  recurrence: "none",
  reminderAt: null,
};

/** Compute an absolute reminder timestamp from the chosen quick-pick. */
function computeReminderAt(
  optionKey: string,
  time: string,
  targetDate: Date,
): number | null {
  const opt = REMINDER_OPTIONS.find((o) => o.key === optionKey);
  if (!opt || opt.kind === "none") return null;
  if (opt.kind === "offset") return Date.now() + opt.minutes * 60_000;
  if (opt.kind === "time" && time) {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(targetDate);
    d.setHours(h, m, 0, 0);
    return d.getTime();
  }
  return null;
}

export function TaskForm({
  onSubmit,
  onCancel,
  onUseTemplate,
  templates,
  dateLabel,
  targetDate,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskDraft>({ defaultValues: DEFAULTS });

  const [reminderKey, setReminderKey] = useState("none");
  const [reminderTime, setReminderTime] = useState("09:00");

  const applyReminder = (key: string, time: string) => {
    setReminderKey(key);
    setValue("reminderAt", computeReminderAt(key, time, targetDate));
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-y-auto p-6 sm:p-8"
    >
      <header>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
          New task
        </p>
        <h2 className="mt-1 font-display text-2xl font-light tracking-tight text-ink">
          Add to {dateLabel}
        </h2>
      </header>

      {/* Templates */}
      {templates.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>Use a template</Label>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onUseTemplate(t)}
                className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink transition-all hover:border-accent/40 hover:shadow-soft"
              >
                <span aria-hidden>{t.icon}</span>
                {t.name}
                <span className="text-xs text-ink-muted/70">
                  +{t.items.length}
                </span>
              </button>
            ))}
          </div>
          <div className="relative py-1 text-center">
            <span className="relative z-10 bg-card px-3 text-[11px] uppercase tracking-widest text-ink-muted/60">
              or add one
            </span>
            <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Task name</Label>
        <Input
          id="title"
          autoFocus
          placeholder="What needs to happen?"
          aria-invalid={!!errors.title}
          {...register("title", {
            required: "Give your task a name",
            validate: (v) => v.trim().length > 0 || "Give your task a name",
          })}
        />
        {errors.title && (
          <span className="text-xs text-accent">{errors.title.message}</span>
        )}
      </div>

      {/* Category + Priority */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            {...register("category")}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Priority</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-canvas p-1">
                {PRIORITIES.map((p) => (
                  <SegChip
                    key={p.key}
                    label={p.label}
                    active={field.value === p.key}
                    onSelect={() => field.onChange(p.key as Priority)}
                    layoutId="priority-pill"
                  />
                ))}
              </div>
            )}
          />
        </div>
      </div>

      {/* Recurrence */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1.5">
          <Repeat className="h-3.5 w-3.5" /> Repeat
        </Label>
        <Controller
          control={control}
          name="recurrence"
          render={({ field }) => (
            <div className="flex flex-wrap gap-1.5">
              {RECURRENCE_OPTIONS.map((o) => (
                <PillToggle
                  key={o.key}
                  label={o.label}
                  active={field.value === o.key}
                  onSelect={() => field.onChange(o.key as RecurrenceRule)}
                />
              ))}
            </div>
          )}
        />
      </div>

      {/* Reminder */}
      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5" /> Reminder
        </Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {REMINDER_OPTIONS.map((o) => (
            <PillToggle
              key={o.key}
              label={o.label}
              active={reminderKey === o.key}
              onSelect={() => applyReminder(o.key, reminderTime)}
            />
          ))}
          {reminderKey === "time" && (
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => {
                setReminderTime(e.target.value);
                applyReminder("time", e.target.value);
              }}
              className="h-9 rounded-lg border border-line bg-canvas px-2 text-sm text-ink focus:border-accent/50 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Color */}
      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2.5">
              {TASK_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => field.onChange(c.key as TaskColor)}
                  aria-label={c.label}
                  aria-pressed={field.value === c.key}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                  style={
                    field.value === c.key
                      ? { boxShadow: `0 0 0 2px ${c.dot}` }
                      : undefined
                  }
                >
                  <span
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: c.dot }}
                  />
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Optional details…"
          {...register("notes")}
        />
      </div>

      <div className="mt-1 flex items-center justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Save task
        </Button>
      </div>
    </form>
  );
}

function SegChip({
  label,
  active,
  onSelect,
  layoutId,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  layoutId: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "relative rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors",
        active ? "text-white" : "text-ink-muted hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg bg-accent"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function PillToggle({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "border-transparent bg-accent text-white"
          : "border-line bg-card text-ink-muted hover:border-ink/20 hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
