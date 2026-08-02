"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PomodoroPhase } from "@/types";
import { POMODORO_DEFAULTS, POMODORO_PHASES } from "@/lib/constants";
import { recordPomodoroSession } from "@/lib/db";
import { showNotification } from "@/lib/notifications";
import { useSettings } from "@/hooks/useSettings";
import { toDateKey } from "@/lib/date";

export type PomodoroStatus = "idle" | "running" | "paused";

interface PomodoroConfig {
  focus: number;
  shortBreak: number;
  longBreak: number;
  longEvery: number;
  autoNext: boolean;
}

interface PomodoroContextValue {
  phase: PomodoroPhase;
  status: PomodoroStatus;
  /** Whole seconds remaining in the current interval. */
  secondsLeft: number;
  /** Planned length of the current interval, in seconds. */
  totalSeconds: number;
  /** 0 → 1 elapsed fraction. */
  progress: number;
  /** Focus sessions completed since the app loaded (drives long-break cadence). */
  cycle: number;
  taskTitle: string | null;
  config: PomodoroConfig;
  start: (phase?: PomodoroPhase) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  skip: () => void;
  reset: () => void;
  selectPhase: (phase: PomodoroPhase) => void;
  setTaskTitle: (title: string | null) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function resolveConfig(pomodoro: PomodoroConfig | undefined): PomodoroConfig {
  return { ...POMODORO_DEFAULTS, ...(pomodoro ?? {}) };
}

function durationSeconds(phase: PomodoroPhase, config: PomodoroConfig): number {
  const minutes =
    phase === "focus"
      ? config.focus
      : phase === "short-break"
        ? config.shortBreak
        : config.longBreak;
  return Math.max(1, Math.round(minutes * 60));
}

/** mm:ss for a whole number of seconds. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/**
 * App-wide Pomodoro timer. A single interval drives the countdown by comparing
 * against a target end-time, so it stays accurate even if the tab is throttled.
 * Completed and skipped intervals are written to history for the daily stats,
 * and finishing an interval fires a native/browser notification.
 */
export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const config = useMemo(
    () => resolveConfig(settings.pomodoro),
    [settings.pomodoro],
  );

  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [status, setStatus] = useState<PomodoroStatus>("idle");
  const [totalSeconds, setTotalSeconds] = useState(() =>
    durationSeconds("focus", resolveConfig(settings.pomodoro)),
  );
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [cycle, setCycle] = useState(0);
  const [taskTitle, setTaskTitle] = useState<string | null>(null);

  // Timekeeping refs (never trigger renders on their own).
  const endAtRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const phaseRef = useRef<PomodoroPhase>(phase);
  const cycleRef = useRef<number>(0);
  const configRef = useRef<PomodoroConfig>(config);
  phaseRef.current = phase;
  cycleRef.current = cycle;
  configRef.current = config;

  // When idle and the config changes (or phase changes while idle), keep the
  // shown time in sync with the selected phase's duration.
  useEffect(() => {
    if (status === "idle") {
      const secs = durationSeconds(phase, config);
      setTotalSeconds(secs);
      setSecondsLeft(secs);
    }
  }, [phase, config, status]);

  const persist = useCallback(
    (completed: boolean, elapsedSeconds: number) => {
      const now = Date.now();
      void recordPomodoroSession({
        phase: phaseRef.current,
        plannedSeconds: durationSeconds(phaseRef.current, configRef.current),
        elapsedSeconds: Math.max(0, Math.round(elapsedSeconds)),
        completed,
        taskTitle,
        date: toDateKey(new Date(now)),
        startedAt: startedAtRef.current || now,
        endedAt: now,
      });
    },
    [taskTitle],
  );

  const nextPhaseAfterFocus = useCallback((completedCycle: number): PomodoroPhase => {
    const every = Math.max(1, configRef.current.longEvery);
    return completedCycle % every === 0 ? "long-break" : "short-break";
  }, []);

  const beginPhase = useCallback((next: PomodoroPhase, run: boolean) => {
    const secs = durationSeconds(next, configRef.current);
    setPhase(next);
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    if (run) {
      startedAtRef.current = Date.now();
      endAtRef.current = Date.now() + secs * 1000;
      setStatus("running");
    } else {
      setStatus("idle");
    }
  }, []);

  // The single ticking loop. Active only while running.
  useEffect(() => {
    if (status !== "running") return;
    const tick = () => {
      const remainingMs = endAtRef.current - Date.now();
      const remaining = Math.ceil(remainingMs / 1000);
      if (remainingMs <= 0) {
        // Interval finished.
        const finished = phaseRef.current;
        const plannedSecs = durationSeconds(finished, configRef.current);
        persist(true, plannedSecs);
        const info = POMODORO_PHASES[finished];
        if (finished === "focus") {
          const nextCycle = cycleRef.current + 1;
          setCycle(nextCycle);
          const next = nextPhaseAfterFocus(nextCycle);
          showNotification(
            "Focus complete · Daily OS",
            `Time for a ${POMODORO_PHASES[next].label.toLowerCase()}.`,
          );
          beginPhase(next, configRef.current.autoNext);
        } else {
          showNotification(
            `${info.label} over · Daily OS`,
            "Back to focus when you're ready.",
          );
          beginPhase("focus", configRef.current.autoNext);
        }
        return;
      }
      setSecondsLeft(Math.max(0, remaining));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [status, persist, nextPhaseAfterFocus, beginPhase]);

  const start = useCallback(
    (nextPhase?: PomodoroPhase) => {
      beginPhase(nextPhase ?? phaseRef.current, true);
    },
    [beginPhase],
  );

  const pause = useCallback(() => {
    setStatus((s) => {
      if (s !== "running") return s;
      // Freeze remaining time.
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      return "paused";
    });
  }, []);

  const resume = useCallback(() => {
    setStatus((s) => {
      if (s !== "paused") return s;
      endAtRef.current = Date.now() + secondsLeft * 1000;
      return "running";
    });
  }, [secondsLeft]);

  const toggle = useCallback(() => {
    if (status === "running") pause();
    else if (status === "paused") resume();
    else start();
  }, [status, pause, resume, start]);

  const skip = useCallback(() => {
    // Record how far we got, then jump to the next phase.
    const planned = durationSeconds(phaseRef.current, configRef.current);
    const elapsed = status === "idle" ? 0 : planned - secondsLeft;
    if (status !== "idle") persist(false, elapsed);
    if (phaseRef.current === "focus") {
      const nextCycle = cycleRef.current + 1;
      setCycle(nextCycle);
      beginPhase(nextPhaseAfterFocus(nextCycle), configRef.current.autoNext);
    } else {
      beginPhase("focus", configRef.current.autoNext);
    }
  }, [status, secondsLeft, persist, nextPhaseAfterFocus, beginPhase]);

  const reset = useCallback(() => {
    const secs = durationSeconds(phaseRef.current, configRef.current);
    setStatus("idle");
    setTotalSeconds(secs);
    setSecondsLeft(secs);
  }, []);

  const selectPhase = useCallback(
    (next: PomodoroPhase) => {
      beginPhase(next, false);
    },
    [beginPhase],
  );

  // Let any surface (Focus Mode's Space key, global shortcuts) drive the timer
  // through window events, so the control logic stays in one place.
  useEffect(() => {
    const onToggle = () => toggle();
    const onSkip = () => skip();
    window.addEventListener("pomodoro:toggle", onToggle);
    window.addEventListener("pomodoro:skip", onSkip);
    return () => {
      window.removeEventListener("pomodoro:toggle", onToggle);
      window.removeEventListener("pomodoro:skip", onSkip);
    };
  }, [toggle, skip]);

  const value = useMemo<PomodoroContextValue>(
    () => ({
      phase,
      status,
      secondsLeft,
      totalSeconds,
      progress: totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0,
      cycle,
      taskTitle,
      config,
      start,
      pause,
      resume,
      toggle,
      skip,
      reset,
      selectPhase,
      setTaskTitle,
    }),
    [
      phase,
      status,
      secondsLeft,
      totalSeconds,
      cycle,
      taskTitle,
      config,
      start,
      pause,
      resume,
      toggle,
      skip,
      reset,
      selectPhase,
    ],
  );

  return (
    <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>
  );
}

/** Access the app-wide Pomodoro timer. Must be used under PomodoroProvider. */
export function usePomodoro(): PomodoroContextValue {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return ctx;
}
