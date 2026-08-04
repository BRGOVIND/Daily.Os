"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
import {
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Settings2,
  Check,
} from "lucide-react";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { usePomodoro, formatClock } from "@/hooks/usePomodoro";
import { usePomodoroStats } from "@/hooks/usePomodoroStats";
import { useSettings } from "@/hooks/useSettings";
import { POMODORO_DEFAULTS, POMODORO_PHASES } from "@/lib/constants";
import type { PomodoroPhase } from "@/types";
import { cn } from "@/lib/utils";

const PHASE_ORDER: PomodoroPhase[] = ["focus", "short-break", "long-break"];

interface PomodoroPanelProps {
  today: Date;
  /** Compact hides history/settings — used inside Focus Mode. */
  compact?: boolean;
}

/** The Pomodoro timer surface: phase switch, ring, controls, history, config. */
export function PomodoroPanel({ today, compact = false }: PomodoroPanelProps) {
  const {
    phase,
    status,
    secondsLeft,
    totalSeconds,
    cycle,
    taskTitle,
    config,
    toggle,
    skip,
    reset,
    selectPhase,
    setTaskTitle,
  } = usePomodoro();
  const stats = usePomodoroStats(today);
  const { update } = useSettings();
  const [showConfig, setShowConfig] = useState(false);

  const tone = POMODORO_PHASES[phase].tone;
  const ratio = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 0;
  const running = status === "running";

  const setConfig = (patch: Partial<typeof config>) =>
    void update({ pomodoro: { ...config, ...patch } });

  return (
    <div className="px-6 pb-7 pt-8 sm:px-8">
      {/* Phase switcher */}
      <div className="mx-auto mb-7 flex w-full max-w-xs items-center rounded-full bg-fill/[0.04] p-1">
        {PHASE_ORDER.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => selectPhase(p)}
            className={cn(
              "relative flex-1 rounded-full px-2 py-2 text-xs font-medium transition-colors sm:text-[13px]",
              phase === p ? "text-white" : "text-ink-muted hover:text-ink",
            )}
          >
            {phase === p && (
              <motion.span
                layoutId="pomo-phase-pill"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: tone }}
                transition={spring.snappy}
              />
            )}
            <span className="relative">{POMODORO_PHASES[p].label}</span>
          </button>
        ))}
      </div>

      {/* Ring + time */}
      <div className="flex flex-col items-center">
        <ProgressRing
          ratio={ratio}
          size={216}
          stroke={10}
          color={tone}
          trackColor="rgba(0,0,0,0.06)"
          shadow
        >
          <div className="flex flex-col items-center">
            <span
              className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-ink"
              aria-live="polite"
            >
              {formatClock(secondsLeft)}
            </span>
            <span className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-ink-muted">
              {status === "paused" ? "Paused" : POMODORO_PHASES[phase].label}
            </span>
          </div>
        </ProgressRing>

        {/* Task line */}
        <input
          value={taskTitle ?? ""}
          onChange={(e) => setTaskTitle(e.target.value || null)}
          placeholder="Focusing on…"
          className="mt-5 w-full max-w-xs rounded-xl bg-fill/[0.03] px-4 py-2.5 text-center text-sm text-ink outline-none placeholder:text-ink-muted/70 focus:ring-2 focus:ring-accent/30"
        />

        {/* Controls */}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={reset}
            aria-label="Reset timer"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink"
          >
            <RotateCcw className="h-[18px] w-[18px]" />
          </button>

          <motion.button
            type="button"
            onClick={toggle}
            whileTap={{ scale: 0.94 }}
            aria-label={running ? "Pause" : "Start"}
            className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-glow transition-colors"
            style={{ backgroundColor: tone }}
          >
            {running ? (
              <Pause className="h-7 w-7" fill="currentColor" />
            ) : (
              <Play className="ml-0.5 h-7 w-7" fill="currentColor" />
            )}
          </motion.button>

          <button
            type="button"
            onClick={skip}
            aria-label="Skip to next session"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink"
          >
            <SkipForward className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Today's stats */}
        {!compact && (
          <div className="mt-7 grid w-full max-w-xs grid-cols-3 gap-2 text-center">
            <Stat label="Sessions" value={stats.focusCompleted} />
            <Stat label="Focus min" value={stats.focusMinutes} />
            <Stat label="Cycle" value={`${cycle % Math.max(1, config.longEvery)}/${config.longEvery}`} />
          </div>
        )}
      </div>

      {!compact && (
        <>
          {/* Settings toggle */}
          <button
            type="button"
            onClick={() => setShowConfig((v) => !v)}
            className="mx-auto mt-6 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-fill/[0.04] hover:text-ink"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Durations & auto-start
          </button>

          {showConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-3 rounded-2xl bg-fill/[0.02] p-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <NumberField
                  label="Focus"
                  value={config.focus}
                  onChange={(v) => setConfig({ focus: v })}
                />
                <NumberField
                  label="Short"
                  value={config.shortBreak}
                  onChange={(v) => setConfig({ shortBreak: v })}
                />
                <NumberField
                  label="Long"
                  value={config.longBreak}
                  onChange={(v) => setConfig({ longBreak: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink">Long break every</span>
                <NumberField
                  label=""
                  value={config.longEvery}
                  onChange={(v) => setConfig({ longEvery: v })}
                  min={2}
                  max={8}
                  compact
                />
              </div>
              <label className="flex items-center justify-between text-sm text-ink">
                Auto-start next session
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.autoNext}
                  onClick={() => setConfig({ autoNext: !config.autoNext })}
                  className={cn(
                    "relative h-6 w-10 rounded-full transition-colors",
                    config.autoNext ? "bg-accent" : "bg-fill/15",
                  )}
                >
                  <motion.span
                    layout
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
                    style={{ left: config.autoNext ? 18 : 2 }}
                  />
                </button>
              </label>
              <button
                type="button"
                onClick={() => void update({ pomodoro: { ...POMODORO_DEFAULTS } })}
                className="text-xs text-ink-muted underline-offset-2 hover:underline"
              >
                Reset to defaults
              </button>
            </motion.div>
          )}

          {/* History */}
          {stats.sessions.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Today&apos;s sessions
              </h3>
              <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
                {stats.sessions.slice(0, 12).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: POMODORO_PHASES[s.phase].tone }}
                    />
                    <span className="text-ink">{POMODORO_PHASES[s.phase].label}</span>
                    {s.taskTitle && (
                      <span className="truncate text-ink-muted">· {s.taskTitle}</span>
                    )}
                    <span className="ml-auto tabular-nums text-ink-muted">
                      {Math.round(s.elapsedSeconds / 60)}m
                    </span>
                    {s.completed ? (
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <span className="text-[11px] text-ink-muted">skipped</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-fill/[0.03] px-2 py-3">
      <div className="text-xl font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 90,
  compact = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
}) {
  return (
    <label className={cn("block", compact && "w-20")}>
      {label && (
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink-muted">
          {label}
        </span>
      )}
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, Math.round(n))));
        }}
        className="w-full rounded-xl bg-card px-3 py-2 text-center text-sm font-medium text-ink shadow-sm outline-none ring-1 ring-fill/5 focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}
