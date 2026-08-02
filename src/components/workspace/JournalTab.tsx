"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useJournal } from "@/hooks/useJournal";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { moodAverage } from "@/workspace";
import { MOOD_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { relativeDay } from "./lib";
import type { Mood } from "@/types";

interface JournalTabProps {
  workspaceId: string;
  todayKey: string;
}

interface Draft {
  mood: Mood | null;
  highlights: string;
  challenges: string;
  lessons: string;
  reflection: string;
}

const EMPTY_DRAFT: Draft = {
  mood: null,
  highlights: "",
  challenges: "",
  lessons: "",
  reflection: "",
};

/** Module 6 — a structured daily journal: mood, highlights, challenges, lessons. */
export function JournalTab({ workspaceId, todayKey }: JournalTabProps) {
  const { entries, entryFor, save } = useJournal(workspaceId);
  const [date, setDate] = useState(todayKey);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saved, setSaved] = useState(false);
  const loadedFor = useRef<string | null>(null);

  const avg = moodAverage(entries);

  // Load the entry for the selected date into the draft when the date changes.
  useEffect(() => {
    if (loadedFor.current === date) return;
    loadedFor.current = date;
    const existing = entryFor(date);
    setDraft(
      existing
        ? {
            mood: existing.mood,
            highlights: existing.highlights,
            challenges: existing.challenges,
            lessons: existing.lessons,
            reflection: existing.reflection,
          }
        : EMPTY_DRAFT,
    );
  }, [date, entryFor]);

  const persist = useDebouncedCallback((next: Draft) => {
    void save({ date, workspaceId, ...next });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, 600);

  const update = (patch: Partial<Draft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      persist(next);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            max={todayKey}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="h-9 rounded-lg border border-line bg-card px-2.5 text-[14px] text-ink focus:border-accent/50 focus:outline-none"
          />
          <span className="text-[13px] text-ink-muted">{relativeDay(date)}</span>
        </div>
        <div className="flex items-center gap-3">
          {avg !== null && (
            <span className="text-[12px] text-ink-muted">
              Avg mood {avg.toFixed(1)}/5 · {entries.length} entries
            </span>
          )}
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-xs text-success"
              >
                <Check className="h-3 w-3" /> Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mood */}
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          How did the day feel?
        </p>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => update({ mood: draft.mood === m.key ? null : m.key })}
              aria-pressed={draft.mood === m.key}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                draft.mood === m.key
                  ? "border-accent bg-accent/10 text-ink"
                  : "border-line text-ink-muted hover:border-ink/20",
              )}
            >
              <span className="text-base">{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      <Field label="Highlights" value={draft.highlights} onChange={(v) => update({ highlights: v })} placeholder="What went well today?" />
      <Field label="Challenges" value={draft.challenges} onChange={(v) => update({ challenges: v })} placeholder="What was hard?" />
      <Field label="Lessons" value={draft.lessons} onChange={(v) => update({ lessons: v })} placeholder="What did you learn?" />
      <Field label="Reflection" value={draft.reflection} onChange={(v) => update({ reflection: v })} placeholder="Anything else on your mind…" rows={4} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{label}</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="bg-card text-[14px]"
      />
    </div>
  );
}
