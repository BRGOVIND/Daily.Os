"use client";

import dynamic from "next/dynamic";
import { Modal } from "@/components/ui/modal";
import { Overview } from "./Overview";
import { StatsHeatmap } from "./StatsHeatmap";
import { Achievements } from "./Achievements";
import { YearInReview } from "./YearInReview";
import { useJournalStats } from "@/hooks/useJournalStats";
import { useSettings } from "@/hooks/useSettings";
import { ACCENTS } from "@/lib/constants";

// Heavy visualizations load on demand.
const GrowthTree = dynamic(
  () => import("./GrowthTree").then((m) => m.GrowthTree),
  { loading: () => <VizSkeleton label="Growing your tree…" /> },
);
const TrendChart = dynamic(
  () => import("./TrendChart").then((m) => m.TrendChart),
  { loading: () => <VizSkeleton label="Drawing your trend…" /> },
);

interface StatsModalProps {
  open: boolean;
  today: Date | null;
  onOpenChange: (open: boolean) => void;
  onSelectDay: (key: string) => void;
}

/**
 * A personal productivity journal, not a dashboard: overview, growth tree,
 * trend, heatmap, milestones and a year in review — calm, editorial, animated.
 */
export function StatsModal({
  open,
  today,
  onOpenChange,
  onSelectDay,
}: StatsModalProps) {
  const stats = useJournalStats(open ? today : null);
  const { settings } = useSettings();
  const accentHex = ACCENTS[settings.accent]?.hex ?? ACCENTS.burgundy.hex;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Your journey"
      description="Productivity journal"
      variant="sheet"
      className="max-w-3xl"
    >
      <div className="flex max-h-[calc(100dvh-3rem)] flex-col">
        <div className="shrink-0 px-6 pb-2 pt-8 sm:px-10 sm:pt-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            Statistics
          </p>
          <h2 className="mt-1 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
            Your journey
          </h2>
        </div>

        <div className="flex-1 space-y-12 overflow-y-auto px-6 pb-16 pt-6 sm:px-10">
          {!stats ? (
            <div className="flex h-64 items-center justify-center">
              <span className="h-8 w-8 animate-pulse rounded-full bg-accent/20" />
            </div>
          ) : (
            <>
              <Overview stats={stats} accentHex={accentHex} />
              <GrowthTree stats={stats} />
              <TrendChart trends={stats.trends} accentHex={accentHex} />
              <StatsHeatmap heatmap={stats.heatmap} onSelectDay={onSelectDay} />
              <Achievements achievements={stats.achievements} />
              <YearInReview review={stats.yearInReview} />

              <p className="pt-2 text-center text-xs text-ink-muted/70">
                Every square, leaf and blossom is a day you showed up.
              </p>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function VizSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-3xl border border-line bg-canvas/50">
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  );
}
