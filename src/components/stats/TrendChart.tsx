"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TrendPoint, TrendRange } from "@/hooks/useJournalStats";

interface TrendChartProps {
  trends: Record<TrendRange, TrendPoint[]>;
  accentHex: string;
}

const SERIES = [
  { key: "task" as const, label: "Tasks", color: "var(--series-accent)" },
  { key: "habit" as const, label: "Habits", color: "#3FA66B" },
  { key: "focus" as const, label: "Focus", color: "#7C5CBF" },
];

const RANGES: { key: TrendRange; label: string }[] = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
  { key: "year", label: "Yearly" },
];

const W = 720;
const H = 240;
const PAD = { top: 20, right: 16, bottom: 28, left: 30 };
const innerW = W - PAD.left - PAD.right;
const innerH = H - PAD.top - PAD.bottom;

function x(i: number, n: number): number {
  return PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
}
function y(v: number): number {
  return PAD.top + innerH * (1 - Math.max(0, Math.min(100, v)) / 100);
}

/** Smooth (Catmull-Rom → cubic bézier) path through the points. */
function smoothPath(values: number[]): string {
  const n = values.length;
  if (n === 0) return "";
  const pts = values.map((v, i) => [x(i, n), y(v)] as const);
  if (n === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n - 1; i += 1) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Section 2 — an editorial line chart. Smooth, animated, minimal. */
export function TrendChart({ trends, accentHex }: TrendChartProps) {
  const [range, setRange] = useState<TrendRange>("week");
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);

  const data = trends[range];
  const n = data.length;

  const paths = useMemo(
    () =>
      SERIES.map((s) => ({
        ...s,
        d: smoothPath(data.map((p) => p[s.key])),
      })),
    [data],
  );

  const labelEvery = range === "month" ? 5 : 1;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((rel - PAD.left) / innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  };

  const active = hover != null ? data[hover] : null;

  return (
    <section aria-label="Productivity trend" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-light tracking-tight text-ink">
          Productivity trend
        </h3>
        <div className="flex gap-1 rounded-full border border-line bg-card p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => {
                setRange(r.key);
                setHover(null);
              }}
              className={cn(
                "relative rounded-full px-3 py-1 text-[13px] font-medium transition-colors",
                range === r.key ? "text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              {range === r.key && (
                <motion.span
                  layoutId="trend-range-pill"
                  className="absolute inset-0 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[13px] text-ink-muted">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.key === "task" ? accentHex : s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>

      <div
        className="relative"
        style={{ ["--series-accent" as string]: accentHex }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`Trend chart, ${range}`}
        >
          {/* minimal gridlines */}
          {[0, 50, 100].map((g) => (
            <g key={g}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(g)}
                y2={y(g)}
                stroke="#ECECEC"
                strokeWidth={1}
                strokeDasharray={g === 0 ? "0" : "3 5"}
              />
              <text
                x={PAD.left - 8}
                y={y(g) + 3}
                textAnchor="end"
                className="fill-ink-muted/60 text-[10px]"
              >
                {g}
              </text>
            </g>
          ))}

          {/* x labels */}
          {data.map((p, i) =>
            i % labelEvery === 0 ? (
              <text
                key={p.key}
                x={x(i, n)}
                y={H - 8}
                textAnchor="middle"
                className="fill-ink-muted/70 text-[10px]"
              >
                {p.label}
              </text>
            ) : null,
          )}

          {/* series lines */}
          {paths.map((p) => (
            <motion.path
              key={`${range}-${p.key}`}
              d={p.d}
              fill="none"
              stroke={p.key === "task" ? accentHex : p.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}

          {/* hover guide + points */}
          {active && hover != null && (
            <g>
              <line
                x1={x(hover, n)}
                x2={x(hover, n)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="#ECECEC"
                strokeWidth={1}
              />
              {SERIES.map((s) => (
                <circle
                  key={s.key}
                  cx={x(hover, n)}
                  cy={y(active[s.key])}
                  r={4}
                  fill="#fff"
                  stroke={s.key === "task" ? accentHex : s.color}
                  strokeWidth={2.5}
                />
              ))}
            </g>
          )}
        </svg>

        {/* tooltip */}
        <AnimatePresence>
          {active && hover != null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute top-0 z-10 rounded-xl border border-line bg-card px-3 py-2 shadow-lift"
              style={{
                left: `${(x(hover, n) / W) * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {active.label}
              </p>
              {SERIES.map((s) => (
                <p key={s.key} className="flex items-center gap-1.5 text-xs text-ink">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.key === "task" ? accentHex : s.color }}
                  />
                  {s.label}
                  <span className="ml-auto font-medium tabular-nums">{active[s.key]}%</span>
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
