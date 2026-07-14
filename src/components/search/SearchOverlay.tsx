"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useSearch } from "@/hooks/useSearch";
import { COLOR_MAP } from "@/lib/constants";
import { formatLongDate, fromDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDay: (dateKey: string) => void;
}

/** Instant cross-day task search. Opens on "/" and lands you in the right day. */
export function SearchOverlay({
  open,
  onOpenChange,
  onSelectDay,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const { results, totalDays } = useSearch(query);

  const select = (dateKey: string) => {
    onSelectDay(dateKey);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) setQuery("");
        onOpenChange(o);
      }}
      title="Search tasks"
      variant="center"
      showClose={false}
      className="max-w-xl"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-ink-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) select(results[0].date);
            }}
            placeholder="Search tasks, notes, categories…"
            aria-label="Search"
            className="w-full bg-transparent text-lg text-ink placeholder:text-ink-muted/60 focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[11px] text-ink-muted sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
          {query.trim() === "" ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-ink-muted">
                Search across all {totalDays} recorded{" "}
                {totalDays === 1 ? "day" : "days"}.
              </p>
              <p className="mt-1 text-[13px] text-ink-muted/70">
                Try a task title, a category, or a word from your notes.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-lg font-light text-ink">
                Nothing found
              </p>
              <p className="mt-1 text-[13px] text-ink-muted">
                No matches for &ldquo;{query}&rdquo;. Try a shorter word, a
                category like <span className="text-ink">Work</span>, or check
                the spelling.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col">
              <AnimatePresence initial={false}>
                {results.map(({ date, task }) => {
                  const swatch = COLOR_MAP[task.color];
                  return (
                    <motion.li
                      key={`${date}-${task.id}`}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <button
                        type="button"
                        onClick={() => select(date)}
                        className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-canvas"
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: swatch.dot }}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block truncate text-[15px]",
                              task.completed
                                ? "text-ink-muted line-through"
                                : "text-ink",
                            )}
                          >
                            {task.title}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            {formatLongDate(fromDateKey(date))} · {task.category}
                          </span>
                        </span>
                        <CornerDownLeft className="h-4 w-4 shrink-0 text-ink-muted/0 transition-colors group-hover:text-ink-muted" />
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
