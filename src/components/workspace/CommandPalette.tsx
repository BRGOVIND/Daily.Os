"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useUniversalSearch } from "@/hooks/useUniversalSearch";
import { cn } from "@/lib/utils";
import type { SearchHit } from "@/workspace";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (hit: SearchHit) => void;
}

/**
 * Module 4 — Universal Search. One Ctrl/⌘+K palette across tasks, habits,
 * missions, notes, resources, journal, workspaces and templates. Results are
 * grouped by category; ↑/↓ move, Enter opens.
 */
export function CommandPalette({ open, onOpenChange, onSelect }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const { groups, total } = useUniversalSearch(query, open);
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten for keyboard navigation.
  const flat = useMemo(() => groups.flatMap((g) => g.hits), [groups]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      // Focus after the sheet animates in.
      const id = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  const choose = (hit: SearchHit) => {
    onSelect(hit);
    onOpenChange(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[cursor]) choose(flat[cursor]);
    }
  };

  let index = -1;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Universal search"
      description="Search everything"
      variant="center"
      showClose={false}
      className="max-w-xl"
    >
      <div className="flex flex-col" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, notes, missions, resources…"
            className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-muted/60 focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[10px] text-ink-muted sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-muted/70">
              Start typing to search across everything.
            </p>
          ) : total === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-muted/70">
              No matches for &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.category} className="mb-1">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted/70">
                  {group.label}
                </p>
                {group.hits.map((hit) => {
                  index += 1;
                  const activeRow = index === cursor;
                  return (
                    <button
                      key={hit.id}
                      type="button"
                      onClick={() => choose(hit)}
                      onMouseEnter={() => setCursor(flat.indexOf(hit))}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                        activeRow ? "bg-accent/10" : "hover:bg-canvas",
                      )}
                    >
                      <span className="text-base">{hit.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-ink">{hit.title}</span>
                        <span className="block truncate text-[12px] text-ink-muted">{hit.subtitle}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
