"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { transition } from "@/lib/motion";
import { format } from "date-fns";
import { ChevronDown, Repeat, Plus, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  DAY_TEMPLATES,
  RECURRENCE_LABEL,
  RECURRENCE_OPTIONS,
  COLOR_MAP,
  type DayTemplateDef,
} from "@/lib/constants";
import { applyDayTemplateOnce, applyDayTemplateRecurring } from "@/lib/dayTemplates";
import { fromDateKey } from "@/lib/date";
import type { RecurrenceRule } from "@/types";
import { cn } from "@/lib/utils";

interface DayTemplatesModalProps {
  open: boolean;
  dateKey: string;
  onOpenChange: (open: boolean) => void;
  onApplied?: (message: string) => void;
}

/**
 * Smart recurring templates — minimal, emoji-free day routines. Each can be
 * dropped onto the day once or turned into a recurring routine at its suggested
 * cadence.
 */
export function DayTemplatesModal({
  open,
  dateKey,
  onOpenChange,
  onApplied,
}: DayTemplatesModalProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [justApplied, setJustApplied] = useState<string | null>(null);
  const dateLabel = dateKey ? format(fromDateKey(dateKey), "EEE, d MMM") : "today";

  const flash = (id: string, message: string) => {
    setJustApplied(id);
    onApplied?.(message);
    window.setTimeout(() => setJustApplied((cur) => (cur === id ? null : cur)), 1400);
  };

  const addOnce = async (def: DayTemplateDef) => {
    await applyDayTemplateOnce(dateKey, def);
    flash(def.id, `${def.name} added to ${dateLabel}`);
  };

  const makeRecurring = async (def: DayTemplateDef, rule: RecurrenceRule) => {
    await applyDayTemplateRecurring(dateKey, def, rule);
    flash(
      def.id,
      rule === "none"
        ? `${def.name} added`
        : `${def.name} set to repeat ${RECURRENCE_LABEL[rule].toLowerCase()}`,
    );
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Routine templates"
      description="Apply an elegant day routine once or on repeat"
      variant="sheet"
      className="max-w-xl"
    >
      <div className="px-5 pb-6 pt-6 sm:px-7">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-ink">Routines</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Ready-made day templates. Applying to {dateLabel}.
          </p>
        </div>

        <div className="space-y-2.5">
          {DAY_TEMPLATES.map((def) => {
            const isOpen = expanded === def.id;
            const done = justApplied === def.id;
            return (
              <div
                key={def.id}
                className="overflow-hidden rounded-2xl border border-fill/5 bg-card"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : def.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-fill/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{def.name}</span>
                      <span className="rounded-full bg-fill/[0.05] px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                        {RECURRENCE_LABEL[def.suggested]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-ink-muted">
                      {def.description}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-ink-muted transition-transform",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={transition.base}
                    >
                      <div className="border-t border-fill/5 px-4 py-3">
                        <ul className="mb-3 space-y-1.5">
                          {def.items.map((item, i) => (
                            <li key={i} className="flex items-center gap-2.5 text-sm text-ink">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: COLOR_MAP[item.color]?.dot }}
                              />
                              {item.title}
                              <span className="ml-auto text-xs text-ink-muted">
                                {item.category}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void addOnce(def)}
                            className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
                          >
                            {done ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            Add to day
                          </button>
                          <button
                            type="button"
                            onClick={() => void makeRecurring(def, def.suggested)}
                            className="flex items-center gap-1.5 rounded-full bg-fill/[0.05] px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-fill/[0.08]"
                          >
                            <Repeat className="h-4 w-4" />
                            Repeat {RECURRENCE_LABEL[def.suggested].toLowerCase()}
                          </button>

                          {/* Other cadences */}
                          <RepeatMenu
                            onPick={(rule) => void makeRecurring(def, rule)}
                            exclude={def.suggested}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

function RepeatMenu({
  onPick,
  exclude,
}: {
  onPick: (rule: RecurrenceRule) => void;
  exclude: RecurrenceRule;
}) {
  const [open, setOpen] = useState(false);
  const options = RECURRENCE_OPTIONS.filter(
    (o) => o.key !== "none" && o.key !== exclude,
  );
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-2.5 py-2 text-sm text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink"
      >
        More
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-10 mb-1 w-36 rounded-xl bg-card p-1 shadow-lift">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onPick(o.key);
                setOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-ink transition-colors hover:bg-fill/[0.05]"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
