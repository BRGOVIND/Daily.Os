"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { TopNav as TopNavBase } from "@/components/layout/TopNav";
import { Fab } from "@/components/layout/Fab";
import { Calendar as CalendarBase } from "@/components/calendar/Calendar";
import { TodayPreview as TodayPreviewBase } from "@/components/calendar/TodayPreview";
import { DayModal } from "@/components/day/DayModal";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import { Toast } from "@/components/ui/Toast";
import { CalendarSkeleton } from "@/components/calendar/CalendarSkeleton";

// Occasional surfaces are code-split so they don't weigh down the calendar.
const SettingsModal = dynamic(() =>
  import("@/components/layout/SettingsModal").then((m) => m.SettingsModal),
);
const CommandPalette = dynamic(() =>
  import("@/components/workspace/CommandPalette").then((m) => m.CommandPalette),
);
const StatsModal = dynamic(() =>
  import("@/components/stats/StatsModal").then((m) => m.StatsModal),
);
const DailyReviewModal = dynamic(() =>
  import("@/components/review/DailyReviewModal").then((m) => m.DailyReviewModal),
);
const MissionsModal = dynamic(() =>
  import("@/components/missions/MissionsModal").then((m) => m.MissionsModal),
);
const WorkspacesModal = dynamic(() =>
  import("@/components/workspace/WorkspacesModal").then((m) => m.WorkspacesModal),
);
const KeyboardHelp = dynamic(() =>
  import("@/components/layout/KeyboardHelp").then((m) => m.KeyboardHelp),
);
const PomodoroModal = dynamic(() =>
  import("@/components/pomodoro/PomodoroModal").then((m) => m.PomodoroModal),
);
const FocusMode = dynamic(() =>
  import("@/components/focus/FocusMode").then((m) => m.FocusMode),
);
const DayTemplatesModal = dynamic(() =>
  import("@/components/templates/DayTemplatesModal").then((m) => m.DayTemplatesModal),
);
const QuickNotesPopover = dynamic(() =>
  import("@/components/notes/QuickNotesPopover").then((m) => m.QuickNotesPopover),
);
const StickyBoard = dynamic(() =>
  import("@/components/notes/StickyBoard").then((m) => m.StickyBoard),
);
import { MotionProvider } from "@/components/providers/MotionProvider";
import { PomodoroProvider } from "@/hooks/usePomodoro";
import { CalendarAgenda as CalendarAgendaBase } from "@/components/calendar/CalendarAgenda";
import { QuickDock as QuickDockBase } from "@/components/layout/QuickDock";
import { DailyUtilitiesPanel as DailyUtilitiesPanelBase } from "@/components/utilities/DailyUtilitiesPanel";
import {
  ReminderToasts,
  type FiredReminder,
} from "@/components/reminders/ReminderToasts";
import { createId } from "@/lib/utils";
import { useDay } from "@/hooks/useDay";
import { useMissions } from "@/hooks/useMissions";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import type { SearchHit } from "@/workspace";
import { useSettings } from "@/hooks/useSettings";
import { useTemplates } from "@/hooks/useTemplates";
import { useReminders, type ReminderTarget } from "@/hooks/useReminders";
import { useDailyReview } from "@/hooks/useDailyReview";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useNativeActions } from "@/hooks/useNativeActions";
import { ensureSeeded } from "@/lib/db";
import { commitTask, applyTemplateToDay } from "@/lib/commitTask";
import {
  addMonths,
  formatMonthTitle,
  startOfMonthOf,
  subMonths,
  toDateKey,
} from "@/lib/date";
import type { TaskDraft, Template } from "@/types";

// Memoize the always-mounted children so an unrelated AppShell state change
// (opening a dialog, a toast, month nav) doesn't re-render the calendar, agenda,
// nav or dock. Their props from AppShell are stable (memoized callbacks), so
// these bail out. Measured: TopNav/QuickDock dropped from 4 re-renders per
// unrelated update to 0. Memoized at the import site since AppShell is their
// only render site.
const TopNav = memo(TopNavBase);
const Calendar = memo(CalendarBase);
const TodayPreview = memo(TodayPreviewBase);
const CalendarAgenda = memo(CalendarAgendaBase);
const QuickDock = memo(QuickDockBase);
const DailyUtilitiesPanel = memo(DailyUtilitiesPanelBase);

/** Returns true once `active` has been true at least once, and stays true. */
function useLatch(active: boolean): boolean {
  const [latched, setLatched] = useState(false);
  useEffect(() => {
    if (active) setLatched(true);
  }, [active]);
  return latched;
}

/**
 * Root client shell. Owns navigation state (which month is shown, which day is
 * open, whether the composer/search/stats/settings/review are open) and wires
 * global concerns — seeding, accent, reminders, the daily review and keyboard
 * shortcuts. Data itself lives in IndexedDB and flows through hooks.
 */
export function AppShell() {
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [month, setMonth] = useState<Date | null>(null);
  const [direction, setDirection] = useState(0);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addTaskFor, setAddTaskFor] = useState<string | null>(null);
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [workspacesOpen, setWorkspacesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Phase 9 daily-productivity surfaces.
  const [quickNotesOpen, setQuickNotesOpen] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [stickiesOpen, setStickiesOpen] = useState(false);
  const [routinesOpen, setRoutinesOpen] = useState(false);
  const [firedReminders, setFiredReminders] = useState<FiredReminder[]>([]);

  const { settings } = useSettings();
  const { templates } = useTemplates();
  const { missions } = useMissions();
  const { setActive: setActiveWorkspace } = useWorkspaces();

  // Latch each occasional modal's first open so its lazy chunk loads on demand
  // but stays mounted afterwards (preserving open/close animations).
  const everSettings = useLatch(settingsOpen);
  const everStats = useLatch(statsOpen);
  const everCommand = useLatch(commandOpen);
  const everMissions = useLatch(missionsOpen);
  const everWorkspaces = useLatch(workspacesOpen);
  const everHelp = useLatch(helpOpen);
  const everReview = useLatch(reviewFor !== null);
  const everPomodoro = useLatch(pomodoroOpen);
  const everFocus = useLatch(focusOpen);
  const everRoutines = useLatch(routinesOpen);
  const everQuickNotes = useLatch(quickNotesOpen);
  const everStickies = useLatch(stickiesOpen);

  // Resolve "now" on the client only to avoid SSR/CSR hydration drift, and seed.
  useEffect(() => {
    const now = new Date();
    setToday(now);
    setMonth(startOfMonthOf(now));
    setMounted(true);
    void ensureSeeded();
  }, []);

  // Keep "today" fresh if the app is left open across midnight (or the tab is
  // refocused later). Only updates state when the calendar day actually changes.
  useEffect(() => {
    const tick = () =>
      setToday((prev) => {
        const now = new Date();
        return !prev || toDateKey(prev) !== toDateKey(now) ? now : prev;
      });
    const id = setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Warm the lazy dialog chunks during idle time after the calendar paints, so
  // the first open of Settings/Stats/Workspaces/etc. is instant instead of
  // waiting on a chunk fetch (the "brief flash before the UI appears"). Still
  // code-split — just prefetched, so the initial bundle is unchanged.
  useEffect(() => {
    if (!mounted) return;
    const run = () => {
      void import("@/components/layout/SettingsModal");
      void import("@/components/stats/StatsModal");
      void import("@/components/workspace/WorkspacesModal");
      void import("@/components/workspace/CommandPalette");
      void import("@/components/missions/MissionsModal");
      void import("@/components/pomodoro/PomodoroModal");
      void import("@/components/templates/DayTemplatesModal");
      void import("@/components/notes/QuickNotesPopover");
      void import("@/components/notes/StickyBoard");
      void import("@/components/focus/FocusMode");
      void import("@/components/review/DailyReviewModal");
      void import("@/components/layout/KeyboardHelp");
    };
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(run, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 800);
    return () => window.clearTimeout(id);
  }, [mounted]);

  const todayKey = today ? toDateKey(today) : null;
  const { day: todayDay, setTaskReminder } = useDay(todayKey);

  // Schedule reminder notifications for today's tasks.
  const reminderTargets = useMemo<ReminderTarget[]>(
    () =>
      todayDay.tasks
        .filter((t) => t.reminderAt && !t.completed)
        .map((t) => ({ id: t.id, title: t.title, reminderAt: t.reminderAt as number })),
    [todayDay.tasks],
  );
  useReminders(reminderTargets, settings.notificationsEnabled, (target) => {
    setFiredReminders((prev) =>
      [...prev, { ...target, fireId: createId() }].slice(-3),
    );
  });

  const dropReminder = useCallback((fireId: string) => {
    setFiredReminders((prev) => prev.filter((r) => r.fireId !== fireId));
  }, []);

  const snoozeReminder = useCallback(
    (item: FiredReminder, minutes: number) => {
      void setTaskReminder(item.id, Date.now() + minutes * 60_000);
      dropReminder(item.fireId);
    },
    [setTaskReminder, dropReminder],
  );

  const snoozeTomorrow = useCallback(
    (item: FiredReminder) => {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      t.setHours(9, 0, 0, 0);
      void setTaskReminder(item.id, t.getTime());
      dropReminder(item.fireId);
    },
    [setTaskReminder, dropReminder],
  );

  const dismissReminder = useCallback(
    (item: FiredReminder) => {
      void setTaskReminder(item.id, null);
      dropReminder(item.fireId);
    },
    [setTaskReminder, dropReminder],
  );

  // Daily review scheduling.
  const reviewCompleted = todayDay.review !== null;
  const { due: reviewDue, dismiss: dismissReview } = useDailyReview(
    today,
    reviewCompleted,
    settings.reviewEnabled,
  );
  useEffect(() => {
    if (reviewDue && todayKey && reviewFor === null) setReviewFor(todayKey);
  }, [reviewDue, todayKey, reviewFor]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setMonth((m) => (m ? subMonths(m, 1) : m));
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setMonth((m) => (m ? addMonths(m, 1) : m));
  }, []);

  const goToday = useCallback(() => {
    if (!today) return;
    setDirection(0);
    setMonth(startOfMonthOf(today));
  }, [today]);

  const openAddTask = useCallback(() => {
    setAddTaskFor(selectedDate ?? todayKey);
  }, [selectedDate, todayKey]);

  const scrollToAgenda = useCallback(() => {
    document
      .getElementById("agenda")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Stable open handlers so memoized children (TopNav, QuickDock) don't re-render
  // on every unrelated AppShell state change. setState setters are stable, so
  // these never need to change identity.
  const openCommand = useCallback(() => setCommandOpen(true), []);
  const openWorkspaces = useCallback(() => setWorkspacesOpen(true), []);
  const openStats = useCallback(() => setStatsOpen(true), []);
  const openMissions = useCallback(() => setMissionsOpen(true), []);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const openQuickNotes = useCallback(() => setQuickNotesOpen(true), []);
  const openPomodoro = useCallback(() => setPomodoroOpen(true), []);
  const openFocus = useCallback(() => setFocusOpen(true), []);
  const openStickies = useCallback(() => setStickiesOpen(true), []);
  const openRoutines = useCallback(() => setRoutinesOpen(true), []);
  const openToday = useCallback(() => {
    if (todayKey) setSelectedDate(todayKey);
  }, [todayKey]);

  const handleAddTask = useCallback(
    (dateKey: string, draft: TaskDraft) => {
      void commitTask(dateKey, draft);
    },
    [],
  );

  const handleUseTemplate = useCallback(
    (dateKey: string, template: Template) => {
      void applyTemplateToDay(dateKey, template);
    },
    [],
  );

  // Route a universal-search hit to the right surface.
  const handleSearchSelect = useCallback(
    (hit: SearchHit) => {
      if (hit.date) {
        setSelectedDate(hit.date);
        return;
      }
      if (hit.category === "missions") {
        setMissionsOpen(true);
        return;
      }
      if (hit.workspaceId) {
        void setActiveWorkspace(hit.workspaceId);
      }
      setWorkspacesOpen(true);
    },
    [setActiveWorkspace],
  );

  const planTomorrow = useCallback(
    (tomorrowKey: string) => {
      setReviewFor(null);
      dismissReview();
      setSelectedDate(tomorrowKey);
    },
    [dismissReview],
  );

  // Global keyboard shortcuts — disabled while any modal is engaged.
  const anyModalOpen =
    selectedDate !== null ||
    addTaskFor !== null ||
    reviewFor !== null ||
    settingsOpen ||
    statsOpen ||
    commandOpen ||
    missionsOpen ||
    workspacesOpen ||
    helpOpen ||
    pomodoroOpen ||
    focusOpen ||
    routinesOpen ||
    quickNotesOpen ||
    stickiesOpen;

  useKeyboardShortcuts(
    {
      onNewTask: openAddTask,
      onSearch: openCommand,
      onCommand: openCommand,
      onOpenToday: openToday,
      onOpenWorkspaces: openWorkspaces,
      onHelp: openHelp,
      onPrevMonth: goPrev,
      onNextMonth: goNext,
      onSave: () => showToast("Everything's saved"),
      onQuickCapture: openAddTask,
      onQuickNote: openQuickNotes,
      onAgenda: scrollToAgenda,
      onFocusMode: openFocus,
    },
    mounted && !anyModalOpen,
  );

  // Native shell: tray menu + global shortcuts route into the same actions.
  useNativeActions({
    onDashboard: openToday,
    onQuickAdd: openAddTask,
    onFocus: openFocus,
  });

  if (!mounted || !month || !today || !todayKey) {
    return <CalendarSkeleton />;
  }

  return (
    <MotionProvider>
    <PomodoroProvider>
    <div className="min-h-dvh bg-canvas">
      <TopNav
        monthTitle={formatMonthTitle(month)}
        onOpenSearch={openCommand}
        onOpenWorkspaces={openWorkspaces}
        onOpenStats={openStats}
        onOpenMissions={openMissions}
        onOpenSettings={openSettings}
      />

      <main className="mx-auto max-w-5xl px-3 pb-32 pt-8 sm:px-8 sm:pt-14">
        <Calendar
          month={month}
          direction={direction}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
          onSelect={setSelectedDate}
        />
        <TodayPreview today={today} onOpen={setSelectedDate} />
        <div id="agenda" className="scroll-mt-4">
          <CalendarAgenda today={today} onOpenDay={setSelectedDate} />
        </div>
      </main>

      <QuickDock
        onQuickNote={openQuickNotes}
        onPomodoro={openPomodoro}
        onFocus={openFocus}
        onStickies={openStickies}
        onRoutines={openRoutines}
      />
      <Fab onClick={openAddTask} />
      <DailyUtilitiesPanel />

      <DayModal
        dateKey={selectedDate}
        today={today}
        onOpenChange={(open) => !open && setSelectedDate(null)}
        onRequestAddTask={setAddTaskFor}
        onOpenReview={setReviewFor}
      />

      <AddTaskModal
        open={addTaskFor !== null}
        dateKey={addTaskFor}
        templates={templates}
        missions={missions}
        onOpenChange={(open) => !open && setAddTaskFor(null)}
        onSubmit={(draft) => {
          if (addTaskFor) handleAddTask(addTaskFor, draft);
        }}
        onUseTemplate={(t) => {
          if (addTaskFor) handleUseTemplate(addTaskFor, t);
        }}
      />

      {everCommand && (
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          onSelect={handleSearchSelect}
        />
      )}

      {everWorkspaces && (
        <WorkspacesModal
          open={workspacesOpen}
          today={today}
          onOpenChange={setWorkspacesOpen}
          onOpenDay={setSelectedDate}
        />
      )}

      {everStats && (
        <StatsModal
          open={statsOpen}
          today={today}
          onOpenChange={setStatsOpen}
          onSelectDay={(key) => {
            setStatsOpen(false);
            setSelectedDate(key);
          }}
        />
      )}

      {everReview && (
        <DailyReviewModal
          open={reviewFor !== null}
          dateKey={reviewFor}
          onOpenChange={(open) => {
            if (!open) {
              setReviewFor(null);
              dismissReview();
            }
          }}
          onPlanTomorrow={planTomorrow}
        />
      )}

      {everMissions && (
        <MissionsModal
          open={missionsOpen}
          today={today}
          onOpenChange={setMissionsOpen}
        />
      )}

      {everSettings && (
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}

      {everHelp && (
        <KeyboardHelp open={helpOpen} onOpenChange={setHelpOpen} />
      )}

      {everPomodoro && (
        <PomodoroModal
          open={pomodoroOpen}
          today={today}
          onOpenChange={setPomodoroOpen}
        />
      )}

      {everRoutines && todayKey && (
        <DayTemplatesModal
          open={routinesOpen}
          dateKey={selectedDate ?? todayKey}
          onOpenChange={setRoutinesOpen}
          onApplied={showToast}
        />
      )}

      {everQuickNotes && todayKey && (
        <QuickNotesPopover
          open={quickNotesOpen}
          dateKey={selectedDate ?? todayKey}
          onClose={() => setQuickNotesOpen(false)}
        />
      )}

      {everStickies && (
        <StickyBoard open={stickiesOpen} onClose={() => setStickiesOpen(false)} />
      )}

      {everFocus && todayKey && (
        <FocusMode
          open={focusOpen}
          today={today}
          todayKey={todayKey}
          onClose={() => setFocusOpen(false)}
        />
      )}

      <ReminderToasts
        items={firedReminders}
        onSnooze={snoozeReminder}
        onTomorrow={snoozeTomorrow}
        onDismiss={dismissReminder}
        onClose={dropReminder}
      />

      <Toast message={toast} />
    </div>
    </PomodoroProvider>
    </MotionProvider>
  );
}
