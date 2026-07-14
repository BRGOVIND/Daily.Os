"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { Achievement, JournalStats } from "@/hooks/useJournalStats";

interface GrowthTreeProps {
  stats: JournalStats;
}

const STAGE_NAMES = ["Seed", "Sprout", "Young tree", "Strong tree", "Cherry blossom"];

const BASE_X = 160;
const BASE_Y = 344;
const VB_W = 320;
const VB_H = 372;

interface Branch {
  d: string;
  width: number;
  order: number;
}
interface Node {
  x: number;
  y: number;
  order: number;
}

/** Tiny deterministic PRNG so the tree is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTree(stage: number, growth: number) {
  const rng = mulberry32(stage * 1000 + Math.round(growth * 20));
  const branches: Branch[] = [];
  const tips: Node[] = [];
  let order = 0;

  const maxDepth = stage === 0 ? 1 : [0, 2, 3, 4, 5][stage];
  const trunkLen = (stage === 0 ? 26 : 52 + stage * 6) * (0.72 + 0.28 * growth);

  const grow = (
    x: number,
    y: number,
    angle: number,
    len: number,
    width: number,
    depth: number,
  ) => {
    const x2 = x + Math.sin(angle) * len;
    const y2 = y - Math.cos(angle) * len;
    const mx = (x + x2) / 2 + (rng() - 0.5) * len * 0.28;
    const my = (y + y2) / 2;
    branches.push({ d: `M ${x} ${y} Q ${mx} ${my} ${x2} ${y2}`, width, order: order++ });
    if (depth <= 0) {
      tips.push({ x: x2, y: y2, order });
      return;
    }
    const children = rng() < 0.35 ? 3 : 2;
    const spread = 0.55 + rng() * 0.3;
    for (let i = 0; i < children; i += 1) {
      const t = i / (children - 1) - 0.5;
      const a = angle + t * spread * 2 + (rng() - 0.5) * 0.18;
      grow(x2, y2, a, len * 0.74, width * 0.66, depth - 1);
    }
  };

  grow(BASE_X, BASE_Y, 0, trunkLen, stage === 0 ? 4 : 9, maxDepth);
  return { branches, tips };
}

export function GrowthTree({ stats }: GrowthTreeProps) {
  const reduce = useReducedMotion();
  const { stage, growth, score } = stats.tree;
  const [selected, setSelected] = useState<Achievement | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);

  const unlocked = useMemo(
    () => stats.achievements.filter((a) => a.unlocked),
    [stats.achievements],
  );

  const { branches, tips } = useMemo(() => buildTree(stage, growth), [stage, growth]);

  // Assign tips: outer tips become achievement blossoms, the rest leaves / buds.
  const { leaves, blossoms } = useMemo(() => {
    const sorted = [...tips].sort((a, b) => a.y - b.y); // higher (smaller y) first
    const blossomCount = stage >= 3 ? Math.min(unlocked.length, sorted.length) : 0;
    const decoBlossoms = stage === 4 ? Math.floor(sorted.length * 0.5) : stage === 3 ? 3 : 0;

    const blossoms: { x: number; y: number; order: number; achievement?: Achievement }[] = [];
    const leaves: { x: number; y: number; order: number; hue: number }[] = [];

    sorted.forEach((tip, i) => {
      if (i < blossomCount) {
        blossoms.push({ ...tip, achievement: unlocked[i] });
      } else if (i < blossomCount + decoBlossoms) {
        blossoms.push({ ...tip });
      } else if (stage >= 1) {
        leaves.push({ ...tip, hue: (tip.order * 37) % 2 });
      }
    });
    return { leaves, blossoms };
  }, [tips, stage, unlocked]);

  const toPct = (x: number, y: number) => ({
    left: `${(x / VB_W) * 100}%`,
    top: `${(y / VB_H) * 100}%`,
  });

  const swayTransition = { duration: 6, repeat: Infinity, ease: "easeInOut" as const };

  return (
    <section aria-label="Your growth tree" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-xl font-light tracking-tight text-ink">
          Your growth
        </h3>
        <span className="text-[13px] text-ink-muted">
          {STAGE_NAMES[stage]} · score {score}
        </span>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-[#FBFBFA] to-[#F4F6F4] p-2">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Growth tree at stage: ${STAGE_NAMES[stage]}, productivity score ${score} of 100`}
        >
          {/* soft ground */}
          <ellipse cx={BASE_X} cy={BASE_Y + 6} rx={72} ry={9} fill="#E7EBE6" />
          {stage === 0 && (
            <motion.g
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              style={{ transformOrigin: `${BASE_X}px ${BASE_Y}px` }}
            >
              <ellipse cx={BASE_X} cy={BASE_Y - 4} rx={9} ry={12} fill="#8B6B57" />
              <path d={`M ${BASE_X} ${BASE_Y - 10} q 6 -10 2 -22`} stroke="#5FA773" strokeWidth={3} fill="none" strokeLinecap="round" />
              <ellipse cx={BASE_X + 6} cy={BASE_Y - 32} rx={7} ry={4} fill="#6DBB86" transform={`rotate(35 ${BASE_X + 6} ${BASE_Y - 32})`} />
            </motion.g>
          )}

          <motion.g
            style={{ transformOrigin: `${BASE_X}px ${BASE_Y}px` }}
            animate={reduce ? undefined : { rotate: [-1.1, 1.1, -1.1] }}
            transition={swayTransition}
          >
            {/* branches */}
            {branches.map((b) => (
              <motion.path
                key={b.order}
                d={b.d}
                stroke="#7C5C49"
                strokeWidth={b.width}
                strokeLinecap="round"
                fill="none"
                initial={reduce ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: reduce ? 0 : 0.5,
                  delay: reduce ? 0 : b.order * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* leaves */}
            {leaves.map((l, i) => (
              <motion.ellipse
                key={`leaf-${i}`}
                cx={l.x}
                cy={l.y}
                rx={6.5}
                ry={3.4}
                fill={l.hue ? "#5FA773" : "#79C293"}
                transform={`rotate(${(l.x - BASE_X) * 0.8} ${l.x} ${l.y})`}
                initial={reduce ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: reduce ? 0 : 0.4,
                  delay: reduce ? 0 : 0.5 + i * 0.02,
                  type: "spring",
                  stiffness: 300,
                  damping: 18,
                }}
              />
            ))}

            {/* blossoms */}
            {blossoms.map((b, i) => (
              <motion.g
                key={`bloss-${i}`}
                initial={reduce ? false : { scale: 0, opacity: 0, rotate: -40 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  duration: reduce ? 0 : 0.5,
                  delay: reduce ? 0 : 0.7 + i * 0.04,
                  type: "spring",
                  stiffness: 260,
                  damping: 16,
                }}
                style={{
                  transformOrigin: `${b.x}px ${b.y}px`,
                  cursor: b.achievement ? "pointer" : "default",
                }}
                onMouseEnter={() =>
                  b.achievement && setHover({ x: b.x, y: b.y, text: b.achievement.title })
                }
                onMouseLeave={() => setHover(null)}
                onClick={() => b.achievement && setSelected(b.achievement)}
              >
                <Flower cx={b.x} cy={b.y} interactive={!!b.achievement} />
              </motion.g>
            ))}
          </motion.g>

          {/* ambient falling petals */}
          {!reduce &&
            stage >= 3 &&
            Array.from({ length: 5 }).map((_, i) => (
              <motion.ellipse
                key={`petal-${i}`}
                rx={3.4}
                ry={2}
                fill="#F1B6CD"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.9, 0],
                  x: [120 + i * 18, 110 + i * 18, 130 + i * 18],
                  y: [140, 300, 330],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 7 + i,
                  repeat: Infinity,
                  delay: i * 1.6,
                  ease: "easeInOut",
                }}
              />
            ))}
        </svg>

        {/* trunk info affordance */}
        <button
          type="button"
          onMouseEnter={() =>
            setHover({
              x: BASE_X,
              y: BASE_Y - 26,
              text: `${stats.longestStreak}-day best · ${stats.activeDays} active days`,
            })
          }
          onMouseLeave={() => setHover(null)}
          onFocus={() =>
            setHover({
              x: BASE_X,
              y: BASE_Y - 26,
              text: `${stats.longestStreak}-day best · ${stats.activeDays} active days`,
            })
          }
          onBlur={() => setHover(null)}
          aria-label={`Productivity score ${score}, longest streak ${stats.longestStreak} days, ${stats.activeDays} active days`}
          className="absolute rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          style={{
            left: `${((BASE_X - 12) / VB_W) * 100}%`,
            top: `${((BASE_Y - 40) / VB_H) * 100}%`,
            width: "8%",
            height: "12%",
          }}
        />

        {/* hover tooltip */}
        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-lift"
              style={toPct(hover.x, hover.y - 8)}
            >
              {hover.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* milestone info card */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-canvas/40 p-4 backdrop-blur-[1px]"
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ scale: 0.92, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xs rounded-2xl border border-line bg-card p-5 text-center shadow-lift"
              >
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                  className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-black/5"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="mx-auto mb-2 text-4xl">{selected.icon}</div>
                <p className="font-display text-xl font-light text-ink">{selected.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{selected.description}</p>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
                  Milestone reached
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-[13px] text-ink-muted">
        {unlocked.length > 0
          ? "Hover a blossom to see the milestone it marks — consistency grows the tree."
          : "Complete tasks consistently to grow your tree from a seed to full blossom."}
      </p>
    </section>
  );
}

/** A small five-petal blossom. */
function Flower({
  cx,
  cy,
  interactive,
}: {
  cx: number;
  cy: number;
  interactive: boolean;
}) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <g>
      {interactive && <circle cx={cx} cy={cy} r={11} fill="#F1B6CD" opacity={0.18} />}
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx={cx}
          cy={cy - 4.6}
          rx={2.9}
          ry={4.2}
          fill={interactive ? "#F19BB9" : "#F4C4D6"}
          transform={`rotate(${deg} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={2.1} fill="#F4A93B" />
    </g>
  );
}
