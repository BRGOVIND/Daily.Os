/** The tabs inside the Workspace hub. */
export type WorkspaceTab =
  | "dashboard"
  | "notes"
  | "resources"
  | "journal"
  | "timeline"
  | "graph"
  | "stats"
  | "share";

export const WORKSPACE_TABS: { key: WorkspaceTab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "notes", label: "Notes" },
  { key: "resources", label: "Resources" },
  { key: "journal", label: "Journal" },
  { key: "timeline", label: "Timeline" },
  { key: "graph", label: "Graph" },
  { key: "stats", label: "Stats" },
  { key: "share", label: "Share" },
];
