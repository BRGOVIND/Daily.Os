"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { useDay } from "@/hooks/useDay";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { dayProgress } from "@/lib/status";
import { formatLongDate, fromDateKey, nextDayKey } from "@/lib/date";

interface DailyReviewModalProps {
  open: boolean;
  dateKey: string | null;
  onOpenChange: (open: boolean) => void;
  onPlanTomorrow: (tomorrowKey: string) => void;
}

const QUESTIONS = [
  { key: "wentWell", label: "What went well?", placeholder: "Wins, however small…" },
  { key: "slowedDown", label: "What slowed you down?", placeholder: "Friction, distractions…" },
  { key: "achievement", label: "Biggest achievement?", placeholder: "The one thing you're proud of…" },
  { key: "improvement", label: "One improvement tomorrow?", placeholder: "A single, concrete change…" },
] as const;

type AnswerKey = (typeof QUESTIONS)[number]["key"];
type Answers = Record<AnswerKey, string>;

const EMPTY: Answers = {
  wentWell: "",
  slowedDown: "",
  achievement: "",
  improvement: "",
};

/** The 10 PM reflection: stats, four questions, and a path into tomorrow. */
export function DailyReviewModal({
  open,
  dateKey,
  onOpenChange,
  onPlanTomorrow,
}: DailyReviewModalProps) {
  const { day, saveReview } = useDay(open ? dateKey : null);
  const [answers, setAnswers] = useState<Answers>(EMPTY);

  // Seed answers from any saved review when the day changes.
  useEffect(() => {
    if (day.review) {
      setAnswers({
        wentWell: day.review.wentWell,
        slowedDown: day.review.slowedDown,
        achievement: day.review.achievement,
        improvement: day.review.improvement,
      });
    } else {
      setAnswers(EMPTY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const persist = useDebouncedCallback((next: Answers) => {
    void saveReview(next);
  }, 600);

  const stats = useMemo(() => {
    const total = day.tasks.length;
    const completed = day.tasks.filter((t) => t.completed).length;
    const habitsDone = Object.values(day.habitLog).filter(Boolean).length;
    const focusDone = day.focus.filter((f) => f.done).length;
    return {
      total,
      completed,
      pct: total === 0 ? 0 : Math.round((completed / total) * 100),
      habitsDone,
      focusDone,
      ...dayProgress(total, completed),
    };
  }, [day]);

  const update = (key: AnswerKey, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    persist(next);
  };

  const planTomorrow = () => {
    void saveReview(answers);
    if (dateKey) onPlanTomorrow(nextDayKey(dateKey));
    onOpenChange(false);
  };

  const heading = dateKey ? formatLongDate(fromDateKey(dateKey)) : "";

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Daily review"
      variant="sheet"
      className="max-w-2xl"
    >
      <div className="flex max-h-[calc(100dvh-3rem)] flex-col">
        <div className="shrink-0 px-6 pb-5 pt-8 sm:px-10 sm:pt-10">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            <Sparkles className="h-3.5 w-3.5" /> Daily review
          </p>
          <h2 className="mt-1 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
            {heading}
          </h2>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 pb-28 sm:px-10">
          {/* Stat band */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Completion" highlight>
              <ProgressRing ratio={stats.pct / 100} color={stats.color} size={52}>
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {stats.pct}%
                </span>
              </ProgressRing>
            </StatCard>
            <StatCard label="Tasks done">
              <Counter value={stats.completed} suffix={`/${stats.total}`} />
            </StatCard>
            <StatCard label="Habits">
              <Counter value={stats.habitsDone} />
            </StatCard>
            <StatCard label="Time spent">
              <span className="flex items-center gap-1 text-2xl font-light text-ink-muted">
                <Clock className="h-4 w-4" /> —
              </span>
            </StatCard>
          </div>

          {/* Reflection */}
          <div className="grid gap-4 sm:grid-cols-2">
            {QUESTIONS.map((q) => (
              <div key={q.key} className="flex flex-col gap-2">
                <Label htmlFor={`rev-${q.key}`}>{q.label}</Label>
                <Textarea
                  id={`rev-${q.key}`}
                  rows={3}
                  value={answers[q.key]}
                  placeholder={q.placeholder}
                  onChange={(e) => update(q.key, e.target.value)}
                  className="min-h-[92px] bg-card"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Floating actions */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-card via-card/95 to-transparent px-6 pb-6 pt-8 sm:px-10">
          <span className="pointer-events-none text-xs text-ink-muted/70">
            Reflection saved automatically
          </span>
          <div className="pointer-events-auto flex items-center gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <motion.button
              type="button"
              onClick={planTomorrow}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-glow transition-colors hover:bg-accent-hover"
            >
              Plan tomorrow
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function StatCard({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center ${
        highlight ? "border-accent/20 bg-accent/[0.04]" : "border-line bg-canvas/50"
      }`}
    >
      <div className="flex h-[52px] items-center">{children}</div>
      <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">
        {label}
      </span>
    </div>
  );
}

function Counter({ value, suffix }: { value: number; suffix?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="font-display text-3xl font-light tabular-nums text-ink"
    >
      {value}
      {suffix && <span className="text-lg text-ink-muted">{suffix}</span>}
    </motion.span>
  );
}
