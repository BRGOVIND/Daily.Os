"use client";

import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Flame, Plus, Repeat, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLOR_MAP, SUGGESTED_HABITS, TASK_COLORS } from "@/lib/constants";
import { spring } from "@/lib/motion";
import type { TaskColor } from "@/types";
import type { HabitView } from "@/hooks/useHabits";

const MILESTONES = [7, 30, 100];

interface HabitChipProps {
  id: string;
  name: string;
  color: TaskColor;
  streak: number;
  done: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * Memoized chip receiving primitives, so toggling one habit re-renders only
 * that chip (its `done`/`streak` changed) — smooth even with many habits.
 */
const HabitChip = memo(function HabitChip({
  id,
  name,
  color,
  streak,
  done,
  onToggle,
  onRemove,
}: HabitChipProps) {
  const swatch = COLOR_MAP[color];
  const reduce = useReducedMotion();
  const [celebrate, setCelebrate] = useState(false);
  const prevDone = useRef(done);

  // Celebrate the moment a completion pushes the streak onto a milestone.
  useEffect(() => {
    const crossed =
      done && !prevDone.current && MILESTONES.includes(streak) && !reduce;
    prevDone.current = done;
    if (crossed) {
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1400);
      return () => clearTimeout(t);
    }
  }, [done, streak, reduce]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={spring.soft}
      className="group relative"
    >
      <AnimatePresence>
        {celebrate && (
          <>
            <motion.span
              key="milestone-label"
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -22, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={spring.pop}
              className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-white shadow-lift"
            >
              🎉 {streak}-day streak
            </motion.span>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
                animate={{
                  opacity: 0,
                  x: (i - 2) * 16,
                  y: -18 - (i % 2) * 8,
                  scale: 1,
                }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1 z-10 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: swatch.dot }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={cn(
          "flex items-center gap-2 rounded-full border py-1.5 pl-2 pr-3 text-sm transition-colors",
          done
            ? "border-transparent text-white"
            : "border-line bg-card text-ink hover:border-ink/20",
        )}
        style={done ? { backgroundColor: swatch.dot } : undefined}
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
            done ? "border-white/70 bg-white/20 text-white" : "border-line text-transparent",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
        {name}
        {streak > 0 && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              done ? "bg-white/20 text-white" : "bg-canvas text-ink-muted",
            )}
          >
            <Flame className="h-3 w-3" />
            <AnimatedCount value={streak} />
          </span>
        )}
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          aria-label={`Remove ${name}`}
          className={cn(
            "ml-0.5 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100",
            done ? "text-white/80" : "text-ink-muted/50 hover:text-ink",
          )}
        >
          <X className="h-3 w-3" />
        </span>
      </button>
    </motion.div>
  );
});

interface HabitsProps {
  habits: HabitView[];
  log: Record<string, boolean>;
  onToggle: (habitId: string) => void;
  onAdd: (name: string, color: TaskColor) => void;
  onRemove: (id: string) => void;
}

export function Habits({ habits, log, onToggle, onAdd, onRemove }: HabitsProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<TaskColor>("green");
  const [adding, setAdding] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name, color);
    setName("");
    setAdding(false);
  };

  return (
    <section aria-label="Habits">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
          <Repeat className="h-4 w-4" />
          Habits
        </h3>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium text-accent transition-colors hover:bg-accent/10"
        >
          <Plus className="h-3.5 w-3.5" /> New habit
        </button>
      </div>

      {habits.length === 0 && !adding && (
        <div className="rounded-2xl border border-dashed border-line p-4">
          <p className="mb-2.5 text-[13px] text-ink-muted">
            Build a daily rhythm. Try one of these:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_HABITS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => onAdd(s.name, s.color)}
                className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent/40"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLOR_MAP[s.color].dot }}
                />
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {habits.map((habit) => (
            <HabitChip
              key={habit.id}
              id={habit.id}
              name={habit.name}
              color={habit.color}
              streak={habit.streak}
              done={log[habit.id] ?? false}
              onToggle={onToggle}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-canvas/60 p-3">
              <input
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Habit name"
                aria-label="Habit name"
                className="min-w-[8rem] flex-1 bg-transparent px-1 text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none"
              />
              <div className="flex items-center gap-1.5">
                {TASK_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setColor(c.key)}
                    aria-label={c.label}
                    className={cn(
                      "h-6 w-6 rounded-full transition-transform hover:scale-110",
                      color === c.key && "ring-2 ring-offset-2 ring-offset-canvas",
                    )}
                    style={{
                      backgroundColor: c.dot,
                      boxShadow: color === c.key ? `0 0 0 2px ${c.dot}` : undefined,
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={submit}
                className="flex h-9 items-center gap-1 rounded-full bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Small spring-animated integer, used for streak counters. */
function AnimatedCount({ value }: { value: number }) {
  return (
    <span className="relative inline-block overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
