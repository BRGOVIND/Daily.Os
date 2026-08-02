"use client";

import { MotionConfig } from "framer-motion";
import { useSettings } from "@/hooks/useSettings";

/**
 * One place that governs motion for the whole app.
 *
 * Framer Motion's JS-driven animations don't obey the CSS
 * `prefers-reduced-motion` block in globals.css, so we route them through
 * `MotionConfig`:
 *
 *   - `reducedMotion="user"`   → follow the operating system setting (default)
 *   - `reducedMotion="always"` → the user forced it on in Settings
 *
 * With reduced motion, Framer keeps opacity fades but drops transform/layout
 * movement, so the UI still reads as responsive without vestibular strain.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
