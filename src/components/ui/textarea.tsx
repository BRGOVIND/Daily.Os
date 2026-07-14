"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex w-full rounded-xl border border-line bg-canvas px-4 py-3 text-[15px] leading-relaxed text-ink placeholder:text-ink-muted/70 transition-colors resize-none",
          "focus-visible:outline-none focus-visible:border-accent/50 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-accent/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
