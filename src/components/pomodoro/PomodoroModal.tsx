"use client";

import { Modal } from "@/components/ui/modal";
import { PomodoroPanel } from "@/components/pomodoro/PomodoroPanel";

interface PomodoroModalProps {
  open: boolean;
  today: Date;
  onOpenChange: (open: boolean) => void;
}

/** The Pomodoro timer in a centered modal. */
export function PomodoroModal({ open, today, onOpenChange }: PomodoroModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Pomodoro timer"
      description="Focus and break timer with session history"
      className="max-w-md"
    >
      <PomodoroPanel today={today} />
    </Modal>
  );
}
