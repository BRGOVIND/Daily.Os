# Design System

Daily OS aims to feel like premium, intentional software — closer to Apple,
Linear, Raycast and Arc than to a busy productivity dashboard. This document is
the single reference for the visual language; the tokens live in
`tailwind.config.ts` and `src/app/globals.css`, and motion lives in
`src/lib/motion.ts`.

## Principles

1. **Calm over loud.** Generous whitespace, a warm near-white canvas, one accent.
2. **Editorial.** A serif display face for headings, a clean sans for body.
3. **Consistent, not clever.** The same radius, shadow and spacing everywhere.
4. **Motion with meaning.** Short, physical transitions; nothing gratuitous;
   fully reducible for accessibility.

## Color

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#FCF4F7` | app background (soft blush) |
| `card` | `#FFFFFF` | surfaces, cards, modals |
| `ink` / `ink-muted` | `#141115` / `#6B646A` | primary / secondary text |
| `line` | `#F0E6EB` | hairline borders |
| `accent` | CSS var `--accent` | interactive & brand (re-themable) |
| `success` / `warning` / `alert` | `#3FA66B` / `#F0B429` / `#E5484D` | state |

The **accent** is a runtime CSS variable (space-separated RGB channels for
alpha), so the six presets in Settings re-theme the whole app instantly without
a rebuild. Task/workspace/mission colours come from a fixed six-swatch palette
(`TASK_COLORS`).

## Typography

- **Display** — Fraunces → Iowan/Palatino/Georgia fallbacks. Headings, numbers,
  empty-state titles. No web-font fetch; graceful system fallback.
- **Sans** — system UI stack. Body, controls, labels.
- Uppercase micro-labels use `text-[11px] tracking-[0.08–0.14em]`.

## Spacing, radius, elevation

- **Spacing** — Tailwind scale; sections separated by `space-y-6`–`space-y-12`;
  modal padding `px-6 sm:px-10`.
- **Radius** — `rounded-xl` (1rem) controls, `rounded-2xl` (1.25rem) cards,
  `rounded-3xl` (1.75rem) modals; `rounded-full` pills & toggles.
- **Shadow** — `soft` (resting cards), `lift` (modals/menus), `glow` (accent
  emphasis on primary buttons).

## Components & states

Primitives live in `src/components/ui/` (`Button`, `Input`, `Select`,
`Textarea`, `Label`, `Modal`, `Toast`, `ProgressRing`). State conventions:

| State | Convention |
| --- | --- |
| Hover | subtle bg (`hover:bg-canvas` / `hover:bg-black/[0.04]`) or border darken |
| Pressed | `active:scale-[0.98]` on buttons |
| Focus | `focus-visible:ring-2 ring-accent/40` (never removed, keyboard-visible) |
| Loading | pulsing accent dot / labelled skeletons for split chunks |
| Empty | icon + one-line title + hint + primary action (`EmptyState`) |
| Success | `text-success` inline confirmations ("Saved") |
| Error | `text-alert` with an `AlertTriangle` |

Empty states are treated as first-class: every major surface (tasks, workspaces,
missions, notes, resources, journal, timeline, graph) has an inviting empty state
with a primary action rather than a blank panel.

## Motion

One motion language (`src/lib/motion.ts`):

- **Durations** 0.15–0.25s for UI feedback; signature ease `[0.22, 1, 0.36, 1]`.
- **Springs** reserved for physical moments — `snappy` (toggles), `soft`
  (cards/modals), `pop` (checks, milestones).
- **Modals** animate via Radix `forceMount` + Framer `AnimatePresence`
  (centre = scale/fade, sheet = slide-up on phones).
- **Reduced motion** — `MotionProvider` wraps the app in `MotionConfig`
  (`reducedMotion="user"` by default, `"always"` when forced in Settings), and
  `globals.css` collapses CSS transitions under `prefers-reduced-motion`.

## Accessibility

- WCAG-AA-oriented contrast for text on canvas/card.
- Full keyboard support (see `?` cheat-sheet); Radix modals trap focus, restore
  it on close, and handle Esc.
- `role="switch"` / `aria-pressed` / `aria-label` on custom controls; `sr-only`
  titles on every modal.
- Zoom is never locked; safe-area insets respected; reduced-motion honoured.

## Iconography

lucide-react throughout, sized 14–20px, `strokeWidth` ~2. Emoji are used only as
user-chosen glyphs (workspaces, missions, moods, resource kinds), never as UI
chrome.
