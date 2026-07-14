"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PRIORITIES } from "@/lib/constants";
import type { Priority } from "@/types";

export interface TaskFilter {
  priority: Priority | "all";
  category: string | "all";
  hideCompleted: boolean;
}

export const DEFAULT_FILTER: TaskFilter = {
  priority: "all",
  category: "all",
  hideCompleted: false,
};

interface TaskFilterBarProps {
  filter: TaskFilter;
  categories: string[];
  onChange: (filter: TaskFilter) => void;
}

/** Minimal, animated filter row for a day's tasks (priority · category · state). */
export function TaskFilterBar({
  filter,
  categories,
  onChange,
}: TaskFilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <Chip
          label="All"
          active={filter.priority === "all"}
          onClick={() => onChange({ ...filter, priority: "all" })}
        />
        {PRIORITIES.map((p) => (
          <Chip
            key={p.key}
            label={p.label}
            active={filter.priority === p.key}
            onClick={() => onChange({ ...filter, priority: p.key })}
          />
        ))}

        <span className="mx-1 h-4 w-px bg-line" />

        <select
          value={filter.category}
          onChange={(e) => onChange({ ...filter, category: e.target.value })}
          aria-label="Filter by category"
          className="h-7 rounded-full border border-line bg-card px-2.5 text-[13px] text-ink focus:border-accent/50 focus:outline-none"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <Chip
          label={filter.hideCompleted ? "Hiding done" : "Show done"}
          active={filter.hideCompleted}
          onClick={() =>
            onChange({ ...filter, hideCompleted: !filter.hideCompleted })
          }
        />
      </div>
    </motion.div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[13px] font-medium transition-colors",
        active
          ? "border-transparent bg-accent text-white"
          : "border-line bg-card text-ink-muted hover:border-ink/20 hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}
