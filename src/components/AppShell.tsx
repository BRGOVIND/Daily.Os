"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { TopNav } from "@/components/layout/TopNav";
import { Fab } from "@/components/layout/Fab";
import { Calendar } from "@/components/calendar/Calendar";
import { TodayPreview } from "@/components/calendar/TodayPreview";
import { DayModal } from "@/components/day/DayModal";
import { AddTaskModal } from "@/components/tasks/AddTaskModal";
import { Toast } from "@/components/ui/Toast";
import { BrandMark } from "@/components/ui/BrandMark";

// Occasional surfaces are code-split so they don't weigh down the calendar.
const SettingsModal = dynamic(() =>
  import("@/components/layout/SettingsModal").then((m) => m.SettingsModal),
);
const SearchOverlay = dynamic(() =>
  import("@/components/search/SearchOverlay").then((m) => m.SearchOverlay),
);
const StatsModal = dynamic(() =>
  import("@/components/stats/StatsModal").then((m) => m.StatsModal),
);
const DailyReviewModal = dynamic(() =>
  import("@/components/review/DailyReviewModal").then((m) => m.DailyReviewModal),
);
import { useDay } from "@/hooks/useDay";
import { useSettings } from "@/hooks/useSettings";
import { useTemplates } from "@/hooks/useTemplates";
import { useReminders, type ReminderTarget } from "@/hooks/useReminders";
import { useDailyReview } from "@/hooks/useDailyReview";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { settings } = useSettings();
  const { templates } = useTemplates();

  // Latch each occasional modal's first open so its lazy chunk loads on demand
  // but stays mounted afterwards (preserving open/close animations).
  const everSettings = useLatch(settingsOpen);
  const everStats = useLatch(statsOpen);
  const everSearch = useLatch(searchOpen);
  const everReview = useLatch(reviewFor !== null);

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

  const todayKey = today ? toDateKey(today) : null;
  const { day: todayDay } = useDay(todayKey);

  // Schedule reminder notifications for today's tasks.
  const reminderTargets = useMemo<ReminderTarget[]>(
    () =>
      todayDay.tasks
        .filter((t) => t.reminderAt && !t.completed)
        .map((t) => ({ id: t.id, title: t.title, reminderAt: t.reminderAt as number })),
    [todayDay.tasks],
  );
  useReminders(reminderTargets, settings.notificationsEnabled);

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
    searchOpen;

  useKeyboardShortcuts(
    {
      onNewTask: openAddTask,
      onSearch: () => setSearchOpen(true),
      onPrevMonth: goPrev,
      onNextMonth: goNext,
      onSave: () => showToast("Everything's saved"),
    },
    mounted && !anyModalOpen,
  );

  if (!mounted || !month || !today || !todayKey) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <BrandMark size={40} decorative className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <TopNav
        monthTitle={formatMonthTitle(month)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-5xl px-5 pb-32 pt-10 sm:px-8 sm:pt-14">
        <Calendar
          month={month}
          direction={direction}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
          onSelect={setSelectedDate}
        />
        <TodayPreview today={today} onOpen={setSelectedDate} />
      </main>

      <Fab onClick={openAddTask} />

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
        onOpenChange={(open) => !open && setAddTaskFor(null)}
        onSubmit={(draft) => {
          if (addTaskFor) handleAddTask(addTaskFor, draft);
        }}
        onUseTemplate={(t) => {
          if (addTaskFor) handleUseTemplate(addTaskFor, t);
        }}
      />

      {everSearch && (
        <SearchOverlay
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onSelectDay={setSelectedDate}
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

      {everSettings && (
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}

      <Toast message={toast} />
    </div>
  );
}
