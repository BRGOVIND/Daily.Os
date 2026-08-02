/**
 * The canonical list of keyboard shortcuts, shared by the handler hook and the
 * on-screen cheat-sheet so the two never drift.
 */

export interface ShortcutDoc {
  keys: string[];
  label: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutDoc[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Global",
    items: [
      { keys: ["⌘", "K"], label: "Command palette" },
      { keys: ["/"], label: "Universal search" },
      { keys: ["?"], label: "Show this cheat-sheet" },
      { keys: ["⌘", "S"], label: "Confirm everything's saved" },
      { keys: ["Esc"], label: "Close any panel" },
    ],
  },
  {
    title: "Navigate",
    items: [
      { keys: ["⌘", "1"], label: "Today's workspace" },
      { keys: ["⌘", "2"], label: "Agenda" },
      { keys: ["⌘", "3"], label: "Focus mode" },
      { keys: ["T"], label: "Open today" },
      { keys: ["W"], label: "Open workspaces" },
      { keys: ["←"], label: "Previous month" },
      { keys: ["→"], label: "Next month" },
    ],
  },
  {
    title: "Capture",
    items: [
      { keys: ["N"], label: "New task" },
      { keys: ["⌘", "⇧", "Space"], label: "Quick capture" },
      { keys: ["⌘", "⌥", "N"], label: "Quick note" },
    ],
  },
];
