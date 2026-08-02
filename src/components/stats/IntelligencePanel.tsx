"use client";

import { motion } from "framer-motion";
import {
  Activity,
  BatteryCharging,
  Brain,
  CalendarRange,
  Flag,
  Gauge,
  HeartPulse,
  Rocket,
} from "lucide-react";
import { useIntelligence } from "@/hooks/useIntelligence";
import { formatDuration } from "@/hooks/usePlanner";
import { cn } from "@/lib/utils";
import { formatHour } from "@/engine";
import type {
  BurnoutRisk,
  IntelligenceReport,
  ProductivityBand,
} from "@/engine";

interface IntelligencePanelProps {
  today: Date | null;
}

const BAND_DOT: Record<string, string> = {
  critical: "#E5484D",
  high: "#C13E6B",
  medium: "#F0B429",
  low: "#9AA0A6",
};

const PRODUCTIVITY_BAND: Record<ProductivityBand, { label: string; className: string }> = {
  thriving: { label: "Thriving", className: "bg-success/12 text-success" },
  steady: { label: "Steady", className: "bg-accent/10 text-accent" },
  building: { label: "Building", className: "bg-warning/15 text-[#8A6100]" },
  struggling: { label: "Rebuilding", className: "bg-[#E5484D]/12 text-[#C13030]" },
};

const BURNOUT_BAND: Record<BurnoutRisk, { label: string; className: string }> = {
  none: { label: "Balanced", className: "bg-success/12 text-success" },
  low: { label: "Low", className: "bg-accent/10 text-accent" },
  elevated: { label: "Elevated", className: "bg-warning/15 text-[#8A6100]" },
  high: { label: "High", className: "bg-[#E5484D]/12 text-[#C13030]" },
};

/**
 * The Intelligence Engine surfaced as a calm set of statistics: productivity
 * score, workload, priority mix, energy, weekly coaching, burnout and mission
 * progress. All numbers come straight from the engine — this panel only renders.
 */
export function IntelligencePanel({ today }: IntelligencePanelProps) {
  const report = useIntelligence(today);
  if (!report) return null;

  return (
    <div className="space-y-6">
      <SectionTitle icon={Brain} label="Intelligence" />
      <ProductivityCard report={report} />
      <WorkloadCard report={report} />
      <PriorityCard report={report} />
      <EnergyCard report={report} />
      <CoachCard report={report} />
      <BurnoutCard report={report} />
      <MissionsCard report={report} />
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  label,
}: {
  icon: typeof Brain;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-accent" />
      <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </h3>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Brain;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-line bg-card p-5 shadow-soft"
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-ink-muted" />
        <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {title}
        </h4>
      </div>
      {children}
    </motion.section>
  );
}

function Bar({ ratio, color }: { ratio: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`,
          backgroundColor: color ?? "rgb(var(--accent))",
        }}
      />
    </div>
  );
}

function ProductivityCard({ report }: { report: IntelligenceReport }) {
  const { productivity } = report;
  const band = PRODUCTIVITY_BAND[productivity.band];
  const deltaLabel =
    productivity.delta > 0
      ? `+${Math.round(productivity.delta)}`
      : `${Math.round(productivity.delta)}`;

  return (
    <Card icon={Activity} title="Productivity score">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl font-light tabular-nums text-ink">
            {productivity.score}
          </span>
          <span className="text-sm text-ink-muted">/ 100</span>
        </div>
        <div className="flex items-center gap-2">
          {productivity.delta !== 0 && (
            <span
              className={cn(
                "text-[12px] font-medium tabular-nums",
                productivity.delta > 0 ? "text-success" : "text-[#C13030]",
              )}
            >
              {deltaLabel}
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              band.className,
            )}
          >
            {band.label}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {productivity.components.map((c) => (
          <div key={c.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[12px] text-ink-muted">
              {c.label}
            </span>
            <div className="flex-1">
              <Bar ratio={c.value / 100} />
            </div>
            <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-ink-muted">
              {c.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-0.5">
        {productivity.reasons.map((r) => (
          <p key={r} className="text-[12px] text-ink-muted">
            • {r}
          </p>
        ))}
      </div>
    </Card>
  );
}

function WorkloadCard({ report }: { report: IntelligenceReport }) {
  const { workload } = report;
  const buckets = [workload.today, workload.tomorrow, workload.week];
  return (
    <Card icon={Gauge} title="Workload">
      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.label}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="text-ink">{b.label}</span>
              <span
                className={cn(
                  "tabular-nums",
                  b.overloaded ? "text-[#C13030]" : "text-ink-muted",
                )}
              >
                {formatDuration(b.minutes)} · {b.taskCount} task
                {b.taskCount === 1 ? "" : "s"}
              </span>
            </div>
            <Bar
              ratio={b.ratio}
              color={b.overloaded ? "#E5484D" : undefined}
            />
          </div>
        ))}
      </div>
      {workload.impossibleToday && (
        <p className="mt-3 rounded-xl bg-[#E5484D]/[0.08] px-3 py-2 text-[12px] text-[#C13030]">
          Today is over a full day of work. Consider moving some tasks.
        </p>
      )}
      {workload.suggestions.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[12px] font-medium text-ink-muted">
            Suggested to move:
          </p>
          {workload.suggestions.slice(0, 3).map((s) => (
            <p key={s.taskId} className="text-[12px] text-ink-muted">
              • {s.title} ({formatDuration(s.minutes)}) → tomorrow
            </p>
          ))}
          <p className="text-[11px] text-ink-muted/60">
            Suggestions only — nothing moves unless you move it.
          </p>
        </div>
      )}
    </Card>
  );
}

function PriorityCard({ report }: { report: IntelligenceReport }) {
  const d = report.priorityDistribution;
  const rows: Array<[string, number, string]> = [
    ["Critical", d.critical, BAND_DOT.critical],
    ["High", d.high, BAND_DOT.high],
    ["Medium", d.medium, BAND_DOT.medium],
    ["Low", d.low, BAND_DOT.low],
  ];
  const max = Math.max(1, d.total);
  return (
    <Card icon={Flag} title="Priority distribution">
      {d.total === 0 ? (
        <p className="text-[13px] text-ink-muted">
          No open tasks to prioritise right now.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map(([label, count, color]) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[12px] text-ink-muted">
                {label}
              </span>
              <div className="flex-1">
                <Bar ratio={count / max} color={color} />
              </div>
              <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-ink-muted">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function EnergyCard({ report }: { report: IntelligenceReport }) {
  const { energy } = report;
  const max = Math.max(1, ...energy.hours.map((h) => h.weightedEffort));
  return (
    <Card icon={BatteryCharging} title="Energy">
      <p className="text-[13px] text-ink">{energy.headline}</p>
      {energy.hasData && (
        <>
          <div className="mt-4 flex h-20 items-end gap-[2px]">
            {energy.hours.map((h) => {
              const inPeak =
                energy.peakWindow &&
                isHourInWindow(
                  h.hour,
                  energy.peakWindow.startHour,
                  energy.peakWindow.endHour,
                );
              return (
                <div
                  key={h.hour}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${Math.max(4, (h.weightedEffort / max) * 100)}%`,
                    backgroundColor: inPeak
                      ? "rgb(var(--accent))"
                      : "rgba(var(--accent), 0.18)",
                  }}
                  title={`${formatHour(h.hour)} · ${h.completions} done`}
                />
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-ink-muted/60">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>11 PM</span>
          </div>
        </>
      )}
    </Card>
  );
}

function isHourInWindow(hour: number, start: number, end: number): boolean {
  if (start <= end) return hour >= start && hour <= end;
  return hour >= start || hour <= end; // wraps midnight
}

function CoachCard({ report }: { report: IntelligenceReport }) {
  const { coach } = report;
  if (!coach.hasData) {
    return (
      <Card icon={CalendarRange} title="Weekly coach">
        <p className="text-[13px] text-ink-muted">
          Keep planning — your first weekly insights appear once there&rsquo;s a
          week of activity to compare.
        </p>
      </Card>
    );
  }
  return (
    <Card icon={CalendarRange} title={`Weekly coach · ${coach.weekLabel}`}>
      <div className="space-y-2.5">
        {coach.insights.map((insight) => (
          <div key={insight.key} className="flex gap-2.5">
            <span aria-hidden className="text-base leading-tight">
              {insight.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink">{insight.title}</p>
              <p className="text-[12px] text-ink-muted">{insight.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BurnoutCard({ report }: { report: IntelligenceReport }) {
  const { burnout } = report;
  const band = BURNOUT_BAND[burnout.risk];
  return (
    <Card icon={HeartPulse} title="Wellbeing">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-ink-muted">Burnout risk</span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            band.className,
          )}
        >
          {band.label}
        </span>
      </div>
      {burnout.signals.length > 0 && (
        <div className="mt-3 space-y-1">
          {burnout.signals.map((s) => (
            <p key={s.key} className="text-[12px] text-ink-muted">
              • {s.label}: {s.detail}
            </p>
          ))}
        </div>
      )}
      <div className="mt-3 space-y-1">
        {burnout.suggestions.map((s) => (
          <p key={s} className="text-[12px] text-ink">
            {s}
          </p>
        ))}
      </div>
    </Card>
  );
}

function MissionsCard({ report }: { report: IntelligenceReport }) {
  const { missions } = report;
  if (missions.length === 0) return null;
  return (
    <Card icon={Rocket} title="Mission progress">
      <div className="space-y-3">
        {missions.map((m) => (
          <div key={m.missionId}>
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-1.5 text-ink">
                <span aria-hidden>{m.icon}</span>
                {m.title}
              </span>
              <span className="tabular-nums text-ink-muted">
                {Math.round(m.overall * 100)}%
              </span>
            </div>
            <Bar ratio={m.overall} />
          </div>
        ))}
      </div>
    </Card>
  );
}
