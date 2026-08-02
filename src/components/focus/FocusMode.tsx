"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Target } from "lucide-react";
import { useDay, sortTasks } from "@/hooks/useDay";
import { useMissions } from "@/hooks/useMissions";
import { usePomodoro } from "@/hooks/usePomodoro";
import { PomodoroPanel } from "@/components/pomodoro/PomodoroPanel";
import { formatLongDate } from "@/lib/date";
import { COLOR_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FocusModeProps {
  open: boolean;
  today: Date;
  todayKey: string;
  onClose: () => void;
}

/**
 * A distraction-free fullscreen surface: a minimal clock, today's single focus,
 * the current mission and task, and the Pomodoro timer over a soft background.
 * Esc exits; Space toggles the timer. A close control keeps it usable on touch.
 */
export function FocusMode({ open, today, todayKey, onClose }: FocusModeProps) {
  const { day, toggleFocus, toggleTask } = useDay(open ? todayKey : null);
  const { missions } = useMissions();
  const { setTaskTitle, start, status } = usePomodoro();
  const [now, setNow] = useState<Date>(today);

  // Live clock — tick every second while open.
  useEffect(() => {
    if (!open) return;
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Keyboard: Esc exits, Space toggles the timer (unless typing).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      const el = e.target as HTMLElement | null;
      const typing =
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);
      if (e.key === " " && !typing) {
        e.preventDefault();
        // Space handled by the panel's own toggle button when focused; here we
        // forward to the timer via a custom event so behaviour stays in one place.
        window.dispatchEvent(new CustomEvent("pomodoro:toggle"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const currentTask = useMemo(
    () => sortTasks(day.tasks).find((t) => !t.completed) ?? null,
    [day.tasks],
  );

  const currentMission = useMemo(() => {
    const active = missions.filter((m) => !m.archived);
    if (currentTask?.missionId) {
      return active.find((m) => m.id === currentTask.missionId) ?? active[0] ?? null;
    }
    return active[0] ?? null;
  }, [missions, currentTask]);

  const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const focusOnCurrent = () => {
    if (!currentTask) return;
    setTaskTitle(currentTask.title);
    if (status === "idle") start("focus");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] overflow-y-auto bg-canvas"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Focus mode"
        >
          {/* Soft animated background glows */}
          <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            <motion.div
              className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl"
              style={{ background: "rgba(var(--accent) / 0.14)" }}
              animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute -bottom-40 -right-40 h-[560px] w-[560px] rounded-full blur-3xl"
              style={{ background: "rgba(var(--accent) / 0.10)" }}
              animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
              transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Close (touch-friendly; keyboard users press Esc) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Exit focus mode"
            className="fixed right-[calc(1rem+env(safe-area-inset-right))] top-[calc(1rem+env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center px-5 py-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
            {/* Minimal clock */}
            <div className="mb-6 text-center">
              <div className="font-mono text-6xl font-light tabular-nums tracking-tight text-ink">
                {timeLabel}
              </div>
              <div className="mt-1 text-sm text-ink-muted">{formatLongDate(now)}</div>
            </div>

            {/* Mission + current task */}
            {currentMission && (
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">
                <Target className="h-3.5 w-3.5" />
                {currentMission.title}
              </div>
            )}

            <div className="mb-6 w-full text-center">
              {currentTask ? (
                <button
                  type="button"
                  onClick={focusOnCurrent}
                  className="group inline-flex max-w-full items-center gap-2 text-balance text-2xl font-semibold text-ink transition-opacity hover:opacity-80"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COLOR_MAP[currentTask.color]?.dot }}
                  />
                  <span className="truncate">{currentTask.title}</span>
                </button>
              ) : (
                <p className="text-lg text-ink-muted">All clear. Nothing left today.</p>
              )}
            </div>

            {/* Pomodoro */}
            <div className="w-full rounded-3xl bg-card/70 shadow-lift backdrop-blur-sm">
              <PomodoroPanel today={today} compact />
            </div>

            {/* Today's focus intentions */}
            {day.focus.length > 0 && (
              <div className="mt-6 w-full">
                <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Today&apos;s focus
                </h3>
                <ul className="space-y-1.5">
                  {day.focus.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => void toggleFocus(f.id)}
                        className="flex w-full items-center gap-3 rounded-xl bg-fill/[0.02] px-4 py-3 text-left transition-colors hover:bg-fill/[0.04]"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            f.done
                              ? "border-accent bg-accent text-white"
                              : "border-fill/20",
                          )}
                        >
                          {f.done && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span
                          className={cn(
                            "text-sm",
                            f.done ? "text-ink-muted line-through" : "text-ink",
                          )}
                        >
                          {f.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {currentTask && (
              <button
                type="button"
                onClick={() => void toggleTask(currentTask.id)}
                className="mt-6 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-colors hover:bg-accent-hover"
              >
                Mark current task done
              </button>
            )}

            <p className="mt-6 text-xs text-ink-muted/70">
              Press <kbd className="rounded bg-fill/5 px-1.5 py-0.5">Esc</kbd> to exit ·{" "}
              <kbd className="rounded bg-fill/5 px-1.5 py-0.5">Space</kbd> start / pause
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
