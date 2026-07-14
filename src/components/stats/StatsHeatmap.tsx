"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { HeatCell } from "@/hooks/useJournalStats";

interface StatsHeatmapProps {
  heatmap: HeatCell[][];
  onSelectDay: (key: string) => void;
}

const HEAT_COLOR: Record<HeatCell["status"], string> = {
  empty: "#EDEDED",
  none: "#F3D2D3",
  partial: "#F6E1AE",
  complete: "#AEDCC2",
};

/** Section 4 — a calm contribution grid. Each square opens that day. */
export function StatsHeatmap({ heatmap, onSelectDay }: StatsHeatmapProps) {
  // Month labels above the first week whose first cell starts a new month.
  const monthLabels = heatmap.map((week, i) => {
    const first = week[0];
    const prev = heatmap[i - 1]?.[0];
    const changed = !prev || format(first.date, "MM") !== format(prev.date, "MM");
    return changed && first.date.getDate() <= 7 ? format(first.date, "MMM") : "";
  });

  return (
    <section aria-label="Activity heatmap" className="flex flex-col gap-3">
      <h3 className="font-display text-xl font-light tracking-tight text-ink">
        Your months
      </h3>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-[4px] pl-0">
            {monthLabels.map((label, i) => (
              <span
                key={i}
                className="w-[14px] text-[10px] text-ink-muted/70"
                style={{ minWidth: 14 }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-[4px]">
            {heatmap.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[4px]">
                {week.map((cell) => (
                  <HeatSquare
                    key={cell.key}
                    cell={cell}
                    index={wi}
                    onSelect={onSelectDay}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-[11px] text-ink-muted">
        <span>Less</span>
        {(["empty", "none", "partial", "complete"] as const).map((s) => (
          <span key={s} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: HEAT_COLOR[s] }} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}

const HeatSquare = memo(function HeatSquare({
  cell,
  index,
  onSelect,
}: {
  cell: HeatCell;
  index: number;
  onSelect: (key: string) => void;
}) {
  const label = `${format(cell.date, "EEE, MMM d")} — ${cell.completed}/${cell.total} tasks`;
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(cell.key)}
      title={label}
      aria-label={label}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, backgroundColor: HEAT_COLOR[cell.status] }}
      transition={{
        opacity: { delay: Math.min(index * 0.01, 0.35), duration: 0.2 },
        scale: { delay: Math.min(index * 0.01, 0.35), duration: 0.2 },
        backgroundColor: { duration: 0.4 },
      }}
      whileHover={{ scale: 1.25, zIndex: 1 }}
      className="h-[14px] w-[14px] rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    />
  );
});
