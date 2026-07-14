"use client";

import { memo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FocusItem } from "@/types";

interface TodaysFocusProps {
  items: FocusItem[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * The day's intentions. The Add card is anchored first; new items appear
 * immediately after it (newest-first). No limit — cards wrap onto new rows and
 * stay elegant at any count.
 */
export function TodaysFocus({
  items,
  onAdd,
  onToggle,
  onRemove,
}: TodaysFocusProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) return;
    onAdd(value);
    setValue("");
  };

  return (
    <section aria-label="Today's Focus">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted">
        <Target className="h-4 w-4 text-accent" />
        Today&rsquo;s Focus
        {items.length > 0 && (
          <span className="text-ink-muted/60">{items.length}</span>
        )}
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Anchored Add card — always the first cell, never moves. */}
        <div className="flex min-h-[104px] items-center rounded-2xl border border-dashed border-line p-3 focus-within:border-accent/40">
          <div className="flex w-full items-center gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Set a focus…"
              aria-label="Add a focus item"
              className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-muted/70 focus:outline-none"
            />
            <button
              type="button"
              onClick={submit}
              aria-label="Add focus"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors hover:bg-accent hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false} mode="popLayout">
          {items.map((item, i) => (
            <FocusCard
              key={item.id}
              item={item}
              number={i + 1}
              onToggle={onToggle}
              onRemove={onRemove}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

interface FocusCardProps {
  item: FocusItem;
  number: number;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * Memoized so toggling or adding one focus item doesn't re-render every card —
 * essential for staying smooth with many items.
 */
const FocusCard = memo(function FocusCard({
  item,
  number,
  onToggle,
  onRemove,
}: FocusCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className={cn(
        "group relative flex min-h-[104px] flex-col justify-between rounded-2xl border p-4 transition-colors",
        item.done
          ? "border-success/30 bg-success/[0.06]"
          : "border-line bg-card hover:border-accent/30",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="font-display text-4xl font-light leading-none text-accent/25">
          {number}
        </span>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label="Remove focus item"
          className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted/40 opacity-0 transition-all hover:bg-black/5 hover:text-ink group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className="mt-2 flex items-start gap-2 text-left"
      >
        <span
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            item.done
              ? "border-success bg-success text-white"
              : "border-line text-transparent",
          )}
        >
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
        <span
          className={cn(
            "text-[15px] font-medium leading-snug",
            item.done ? "text-ink-muted line-through" : "text-ink",
          )}
        >
          {item.title}
        </span>
      </button>
    </motion.div>
  );
});
