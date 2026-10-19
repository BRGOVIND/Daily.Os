"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  LayoutGrid,
  Menu,
  Moon,
  NotebookPen,
  Plus,
  Rocket,
  Settings,
  Sparkles,
  StickyNote,
  Timer,
  LayoutTemplate,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type MobileView = "today" | "calendar";

interface MobileNavProps {
  view: MobileView;
  onViewChange: (view: MobileView) => void;
  onAddTask: () => void;
  onOpenWorkspaces: () => void;
  onOpenMissions: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenQuickNote: () => void;
  onOpenPomodoro: () => void;
  onOpenFocus: () => void;
  onOpenStickies: () => void;
  onOpenRoutines: () => void;
  onOpenUtilities: () => void;
}

export function MobileNav({
  view,
  onViewChange,
  onAddTask,
  onOpenWorkspaces,
  onOpenMissions,
  onOpenStats,
  onOpenSettings,
  onOpenQuickNote,
  onOpenPomodoro,
  onOpenFocus,
  onOpenStickies,
  onOpenRoutines,
  onOpenUtilities,
}: MobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const run = (action: () => void) => {
    setMoreOpen(false);
    action();
  };

  const moreActions = [
    { label: "Missions", Icon: Rocket, action: onOpenMissions },
    { label: "Insights", Icon: BarChart3, action: onOpenStats },
    { label: "Settings", Icon: Settings, action: onOpenSettings },
    { label: "Utilities", Icon: LayoutGrid, action: onOpenUtilities },
    { label: "Quick note", Icon: NotebookPen, action: onOpenQuickNote },
    { label: "Pomodoro", Icon: Timer, action: onOpenPomodoro },
    { label: "Focus mode", Icon: Moon, action: onOpenFocus },
    { label: "Sticky notes", Icon: StickyNote, action: onOpenStickies },
    { label: "Routines", Icon: LayoutTemplate, action: onOpenRoutines },
  ];

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur-xl sm:hidden"
      >
        <div className="mx-auto grid h-[4.5rem] max-w-lg grid-cols-5 px-1">
          <NavItem label="Today" Icon={Sparkles} active={view === "today"} onClick={() => onViewChange("today")} />
          <NavItem label="Calendar" Icon={CalendarDays} active={view === "calendar"} onClick={() => onViewChange("calendar")} />
          <button
            type="button"
            onClick={onAddTask}
            aria-label="New task"
            className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-soft">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-semibold">Add</span>
          </button>
          <NavItem label="Spaces" Icon={LayoutGrid} onClick={onOpenWorkspaces} />
          <NavItem label="More" Icon={Menu} expanded={moreOpen} onClick={() => setMoreOpen(true)} />
        </div>
      </nav>

      <Modal
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title="More"
        variant="sheet"
      >
        <div className="max-h-[85dvh] overflow-y-auto px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-10">
          <h2 className="font-display text-3xl text-ink">More</h2>
          <p className="mt-1 text-sm text-ink-muted">Your spaces, insights, and daily tools.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {moreActions.map(({ label, Icon, action }) => (
              <button
                key={label}
                type="button"
                onClick={() => run(action)}
                className="flex min-h-14 items-center gap-3 rounded-2xl bg-canvas px-3 text-left text-sm font-medium text-ink transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Icon className="h-5 w-5 shrink-0 text-accent" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}

function NavItem({
  label,
  Icon,
  onClick,
  active = false,
  expanded,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-expanded={expanded}
      className={cn(
        "flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        active || expanded ? "text-accent" : "text-ink-muted",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}
