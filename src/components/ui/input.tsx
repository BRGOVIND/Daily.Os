"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-line bg-canvas px-4 text-[15px] text-ink placeholder:text-ink-muted/70 transition-colors",
          "focus-visible:outline-none focus-visible:border-accent/50 focus-visible:bg-card focus-visible:ring-4 focus-visible:ring-accent/10",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
