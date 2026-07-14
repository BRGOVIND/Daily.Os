/**
 * The one motion language for Daily OS.
 *
 * Durations sit in the 0.15–0.25s range for UI feedback; springs are reserved
 * for physical, playful moments (checks, cards, the FAB). Import these instead
 * of hand-tuning transitions per component so motion stays cohesive.
 */

/** Signature easing — a gentle "ease-out-expo" that never snaps. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.2,
  slow: 0.25,
} as const;

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE },
  base: { duration: DURATION.base, ease: EASE },
  slow: { duration: DURATION.slow, ease: EASE },
} as const;

/** Springs for tactile elements. */
export const spring = {
  /** Buttons, small toggles. */
  snappy: { type: "spring", stiffness: 480, damping: 30 } as const,
  /** Cards, modals, list reflow. */
  soft: { type: "spring", stiffness: 320, damping: 32, mass: 0.9 } as const,
  /** Celebratory pops (checks, milestones). */
  pop: { type: "spring", stiffness: 500, damping: 22 } as const,
};
