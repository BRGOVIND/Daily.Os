"use client";

import { motion } from "framer-motion";
import { spring } from "@/lib/motion";
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
    <div className="mb-7 flex items-end justify-between gap-3 sm:mb-8 sm:gap-4">
      {/* Month + year. Stacks on phones so long names (September, December)
          never clip or collide with the controls; inline on desktop. */}
      <motion.h1
        key={format(month, "yyyy-MM")}
        initial={{ opacity: 0, x: direction >= 0 ? 24 : -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={spring.soft}
        className="flex min-w-0 flex-col font-display text-[2.25rem] font-light leading-[1.02] tracking-[-0.02em] text-ink sm:block sm:text-6xl sm:leading-[1.05]"
      >
        <span className="truncate">{format(month, "MMMM")}</span>
        <span className="text-ink-muted/60 sm:ml-3">{format(month, "yyyy")}</span>
      </motion.h1>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onToday}
          className="mr-0.5 h-9 sm:mr-1 sm:h-8"
        >
          Today
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={onPrev}
          className="h-11 w-11 sm:h-10 sm:w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={onNext}
          className="h-11 w-11 sm:h-10 sm:w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
