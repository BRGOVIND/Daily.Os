# Intelligence Engine

Daily OS's Intelligence Engine is a self-contained domain that turns a snapshot
of your data — days, tasks, habits and missions — into planning, prioritisation
and coaching outputs. It is what makes Daily OS behave like a quiet productivity
coach rather than a passive to-do list.

Three principles shape it:

1. **Algorithms first, AI never (yet).** Everything here is deterministic maths
   and template strings. There is **no AI, no network, no model** — the engine
   runs fully offline and produces the same output for the same input.
2. **Isolated from the UI.** The engine lives entirely under `src/engine/` and
   depends only on `@/types`, `date-fns` and its own modules. It imports nothing
   from React, Dexie or any component. The UI *consumes* its outputs; it never
   re-implements them.
3. **Recommendations, not actions.** The engine suggests. It never mutates the
   user's plan, moves a task, or overwrites a schedule. Every write stays a
   deliberate user action.

---

## Architecture

```
src/engine/
  index.ts                 # public API barrel — the only import surface the app uses
  models/
    types.ts               # every output shape (PriorityBreakdown, DayPlan, …)
    constants.ts           # tunable weights & thresholds in one place
  utils/
    math.ts                # clamp, mean, pct, round
    time.ts                # day-part mapping, hour formatting
    tasks.ts               # defaulting accessors over smart-task metadata
  prediction/
    priority.ts            # Module 3 — calculated priority + distribution
    estimation.ts          # Module 9 — committed-minute totals
  analytics/
    workload.ts            # Module 4 — workload + move suggestions
    productivity.ts        # Module 5 — blended productivity score
    energy.ts              # Module 6 — when you do your best work
    burnout.ts             # Module 7 — unsustainable-pattern detection
    coach.ts               # Module 8 — weekly template insights
  planner/
    planner.ts             # Module 2 — recommended day schedule
  recommendation/
    missions.ts            # Module 10 — mission progress & daily nudges
    report.ts              # aggregate: run everything over one snapshot
```

The app touches the engine through two thin hooks:

- `useIntelligence(today)` runs `buildIntelligenceReport` over the live database,
  memoized so the (non-trivial) computation only re-runs when days, habits or
  missions actually change.
- `usePlanner(dateKey, today)` builds a recommended schedule for a single day.

Everything a task needs is read through the defaulting accessors in
`utils/tasks.ts` (`estMinutes`, `difficultyOf`, `energyOf`, …), so a bare
pre-Phase-4 task with none of the new fields is scored exactly like a fully
annotated one — no special cases anywhere in the engine.

---

## The smart task model

Phase 4 extended `Task` with optional, back-compatible metadata:

| Field | Meaning | Source of truth |
| --- | --- | --- |
| `estimatedMinutes` | Estimated duration | user (composer) |
| `energy` | Energy required (`low`/`medium`/`high`) | user |
| `difficulty` | Effort (`easy`/`medium`/`hard`) | user |
| `deadline` | Hard deadline (day key) | user |
| `completedAt` | Completion timestamp | set on toggle |
| `timesDeferred` | Times pushed to a later day | app |
| `timesRescheduled` | Times its day changed | app |
| `missionId` | Link to a Mission | user |
| `createdAt`, `priority` | Created date, manual priority | existing |

Derived quantities the modules the spec calls out — **recurrence weight**,
**category weight**, **calculated priority**, **completion time** — are *computed
by the engine*, not stored. Storing derived values invites staleness; computing
them keeps the raw task the single source of truth. They surface through engine
outputs (`PriorityBreakdown.factors`, the energy analysis, etc.).

See [Migration strategy](#migration-strategy) for how older data is normalized.

---

## Module 3 — Automatic Priority

`computePriority(task, today)` produces a **0–100 score** and a band
(`low` / `medium` / `high` / `critical`) from seven normalized factors, each
weighted (weights sum to 1):

| Factor | Weight | Notes |
| --- | --- | --- |
| Deadline urgency | 0.30 | overdue → 1.0; no deadline → mild 0.2 |
| Manual priority | 0.20 | your explicit choice still matters |
| Difficulty | 0.15 | harder work ranks up |
| Deferrals | 0.15 | repeatedly postponed work nags louder |
| Duration | 0.08 | longer tasks worth starting sooner |
| Recurrence | 0.07 | daily commitments carry weight |
| Category | 0.05 | Work/Learning weighted above Errands/Ideas |

Bands: `< 25` Low · `25–49` Medium · `50–74` High · `≥ 75` Critical. An
**overdue** task is floored at Critical regardless of other factors. Completed
tasks score 0. Every score ships with human `reasons` ("Due today", "Postponed
3×", "Hard task"). Manual priority is never discarded — the user can always read
their own choice in the breakdown, and the UI still lets them set it.

`priorityDistribution(tasks, today)` tallies bands across the open backlog for
the statistics view.

---

## Module 2 — Planner

`buildDayPlan(date, day, habits, today, peakPart)` shapes a day into
**Morning → Afternoon → Evening → Night** sections. Placement heuristics:

- **Overdue** tasks → first thing in the morning.
- **Hard / high-energy** tasks → the user's **peak window** (from energy
  analysis; defaults to morning).
- **Health** → evening · **Errands** → afternoon · reflection/review keywords →
  night · easy low-energy filler → afternoon.
- **Habits** are placed by name (gym → evening, read → night, meditate →
  morning), and a gentle "Reflect on today" ritual closes the night if no review
  exists yet.

Within a section, items sort by calculated-priority band. The plan carries
advisory `notes` (overdue counts, "this is a heavy day — consider moving ~X min")
and a total estimate. It **returns suggestions only** and is rendered as a
collapsible card in the day workspace.

---

## Module 4 / 9 — Workload & Estimation

`analyzeWorkload(today, byDate)` sums committed (incomplete) minutes for **today**,
**tomorrow** and the **rest of the week**, each against a healthy capacity
(`DAILY_CAPACITY_MIN = 360`, i.e. ~6 focused hours). It classifies the day
(`light` / `balanced` / `heavy` / `overloaded`), flags an *impossible* day, and
when overloaded proposes **which specific tasks to move** — lowest calculated
priority first, never anything due today. It only suggests; the user moves.

---

## Module 5 — Productivity Score

`computeProductivity(today, byDate, habits)` blends seven components measured
over a 14-day window (weights sum to 1):

| Component | Weight | Measures |
| --- | --- | --- |
| Consistency | 0.22 | showing up (days with any completion) |
| Task completion | 0.20 | average daily completion % |
| Habit completion | 0.16 | habits checked vs defined |
| Planning | 0.14 | days you set intentions (focus) |
| Focus | 0.12 | focus items followed through |
| Deep work | 0.10 | hard/high-energy tasks completed |
| Recovery | 0.06 | lighter days + reflection |

The score is compared against the **previous 14-day window** to produce a delta
and plain-language `reasons` ("Your habit completion improved (+12)."). Bands:
Struggling / Building / Steady / Thriving. Users without habits aren't punished —
that component defaults to a neutral baseline.

---

## Module 6 — Energy Analysis

`analyzeEnergy(tasks)` buckets completed tasks by their **completion hour**,
weighted by difficulty, and finds the best contiguous 3-hour window of
hard-weighted effort. It yields a 24-hour histogram, a **peak window**, the
day-part it falls in, and a headline ("You complete demanding work most
consistently between 8 AM and 11 AM."). The Planner consumes the peak window to
place demanding tasks. Below a minimum sample count it reports honestly that
there isn't enough data yet.

---

## Module 7 — Burnout Detection

`detectBurnout(today, byDate, habits, windowTasks)` looks for five patterns:
consecutive heavy days, too few breaks this week, repeatedly unfinished/overdue
work, slipping habits, and late-night workload. Each becomes a graded signal;
the composite emphasises the strongest signal while accounting for breadth,
mapping to `none` / `low` / `elevated` / `high`. Suggestions are gentle and
specific ("Plan a deliberately lighter day this week."). It is advisory and
never intrusive.

---

## Module 8 — Weekly Coach

`weeklyCoach(today, byDate, habits, windowTasks)` compares the last 7 days to the
7 before and assembles insights from **string templates** — most/least
productive day, most consistent habit, a declining habit, repeatedly postponed
tasks, and a versus-last-week improvement figure. **No AI**: it is pure numeric
comparison wrapped in sentence templates.

---

## Module 10 — Mission Mode

Missions are long-term objectives ("Crack Placements") persisted in their own
Dexie table, with milestones and linked habits. Tasks link to a mission via
`Task.missionId`.

`missionProgress(mission, tasks, today)` blends **milestone completion (0.6)** and
**linked-task completion (0.4)**, compares progress to elapsed time toward the
target date to derive a **pace** (`ahead` / `on-track` / `behind` / `unknown`),
and surfaces the next milestone. `missionRecommendations(...)` turns active
missions into daily nudges, favouring those behind pace, which the Planner can
surface. Deleting a mission transactionally detaches its tasks.

---

## New statistics

The engine's `IntelligenceReport` powers a new **Intelligence** panel in the
statistics journal: productivity score with component breakdown and reasons,
workload buckets with move suggestions, priority distribution, the energy
histogram with the peak window highlighted, weekly coach insights, a wellbeing /
burnout readout, and mission progress bars — all rendered from engine output,
none recomputed in the UI.

---

## Performance considerations

- **Single-pass reads.** `useIntelligence` reads days, habits and missions once
  and builds the whole report inside one `useMemo`, keyed on those arrays — the
  computation only re-runs when the underlying data actually changes.
- **Inert when closed.** Both hooks read and compute nothing while their host
  modal is closed (`today`/`dateKey` is null).
- **Code-split.** The stats and missions surfaces (and thus the heaviest engine
  paths) load via `next/dynamic`, so the calendar home stays light — the home
  route's first-load JS moved only ~10 kB.
- **Pure & allocation-light.** Engine functions avoid per-render allocation
  churn; `TaskItem` stays memoized and computes its badge from a stable
  `today` string.

---

## Migration strategy

The database moved to **v3**:

- A new `missions` table is created.
- Every day's tasks are **backfilled** (`db.ts → backfillTask`): counters start
  at 0, a task already marked complete gets a best-effort `completedAt` so energy
  and time analysis have a signal, and `deadline`/`missionId` default to `null`.
- All new task fields are **optional**, so pre-Phase-4 records and older JSON
  backups load untouched — and the engine's defaulting accessors mean an
  un-backfilled task still scores correctly.
- Export/import (`backup.ts`) now round-trips missions and tolerates their
  absence in older bundles.

---

## Future AI integration points

Every module is a pure function with a typed output, which makes each a clean
seam for an optional future model — **without** changing the offline default:

- **Priority** — `computePriority` could accept a learned per-user weight vector
  in place of the fixed `PRIORITY_FACTOR_WEIGHTS`.
- **Planner** — `buildDayPlan`'s placement heuristics could be replaced or
  re-ranked by a model, still emitting the same `DayPlan` shape.
- **Energy** — the peak-window detector could give way to a learned personal
  rhythm curve.
- **Coach & Burnout** — template strings could be swapped for generated prose
  behind the same `CoachInsight` / `BurnoutReport` contracts.
- **Estimation** — `estMinutes` could return a model's predicted duration from
  historical actuals instead of the user's estimate.

An AI layer would sit *behind* these interfaces and remain entirely optional.
The engine must always function fully offline, exactly as it does today.
