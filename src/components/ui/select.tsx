"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

/** A calm, native-backed select — accessible, keyboard-friendly, styled. */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-line bg-canvas px-4 pr-10 text-[15px] text-ink transition-colors",
            "focus-visible:outline-none focus-visible:border-accent/50 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-accent/10",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
