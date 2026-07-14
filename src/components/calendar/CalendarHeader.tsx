"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  direction: number;
}

/**
 * The month title dominates the page — big editorial serif — flanked by quiet
 * navigation. This is the emotional centre of the home screen.
 */
export function CalendarHeader({
  month,
  onPrev,
  onNext,
  onToday,
  direction,
}: CalendarHeaderProps) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="overflow-hidden">
        <motion.h1
          key={format(month, "yyyy-MM")}
          initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="font-display text-[2.75rem] font-light leading-[1.05] tracking-[-0.02em] text-ink sm:text-6xl"
        >
          {format(month, "MMMM")}
          <span className="ml-3 text-ink-muted/60">{format(month, "yyyy")}</span>
        </motion.h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onToday} className="mr-1">
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={onPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={onNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
