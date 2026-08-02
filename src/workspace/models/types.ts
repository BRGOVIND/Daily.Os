/**
 * Workspace OS — output & input shapes.
 *
 * Everything here is plain data. The workspace domain is UI-agnostic: it takes a
 * {@link WorkspaceSnapshot} of the user's data and returns timelines, search
 * results, graphs and statistics. Nothing in this layer imports React or Dexie.
 */

import type {
  HabitDef,
  JournalEntry,
  Mission,
  Resource,
  Task,
  TaskColor,
  Template,
  Workspace,
  WorkspaceNote,
} from "@/types";

/** A task paired with the day it lives on (tasks are stored inside days). */
export interface DatedTask {
  task: Task;
  date: string;
}

/** A completed daily review, reduced to what the timeline needs. */
export interface ReviewMark {
  date: string;
  completedAt: number;
}

/**
 * A read-only snapshot of everything the workspace domain reasons over. The
 * hooks build this once from IndexedDB; the pure functions below never touch
 * the database themselves.
 */
export interface WorkspaceSnapshot {
  workspaces: Workspace[];
  tasks: DatedTask[];
  missions: Mission[];
  notes: WorkspaceNote[];
  resources: Resource[];
  journal: JournalEntry[];
  reviews: ReviewMark[];
  habits: HabitDef[];
  templates: Template[];
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export type TimelineKind =
  | "workspace-created"
  | "mission-created"
  | "milestone-completed"
  | "task-completed"
  | "journal-entry"
  | "resource-added"
  | "note-updated"
  | "review-completed";

/** One chronological event in a workspace's automatically-built timeline. */
export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  /** Epoch ms — the sort key. */
  timestamp: number;
  /** Day key (yyyy-MM-dd) for date grouping in the UI. */
  date: string;
  icon: string;
  color: TaskColor | null;
  /** Id of the underlying entity, so the UI can open it. */
  refId: string;
}

// ─── Knowledge graph ───────────────────────────────────────────────────────

export type GraphNodeType =
  | "workspace"
  | "mission"
  | "milestone"
  | "task"
  | "journal"
  | "resource"
  | "note";

/** A positioned node. Coordinates are normalized to a [-1, 1] unit square. */
export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  x: number;
  y: number;
  color: TaskColor | null;
  refId: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphModel {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ─── Universal search ──────────────────────────────────────────────────────

export type SearchCategory =
  | "workspaces"
  | "tasks"
  | "missions"
  | "notes"
  | "resources"
  | "journal"
  | "habits"
  | "templates";

export interface SearchHit {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  /** Day key to navigate to, when the hit belongs to a specific day. */
  date: string | null;
  /** Owning workspace, when known — lets the UI jump into it. */
  workspaceId: string | null;
  icon: string;
  refId: string;
}

export interface SearchGroup {
  category: SearchCategory;
  label: string;
  hits: SearchHit[];
}

// ─── Statistics ───────────────────────────────────────────────────────────

export interface WorkspaceStats {
  taskTotal: number;
  taskCompleted: number;
  taskCompletionRate: number;
  missionTotal: number;
  missionCompleted: number;
  noteCount: number;
  resourceCount: number;
  journalCount: number;
  journalStreak: number;
  /** Sum of estimated minutes across completed tasks. */
  timeInvestedMinutes: number;
  /** Completions per day for the last 7 days, oldest → newest. */
  weeklyActivity: number[];
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export interface DashboardData {
  workspace: Workspace;
  stats: WorkspaceStats;
  activeTasks: DatedTask[];
  recentNotes: WorkspaceNote[];
  recentResources: Resource[];
  recentTimeline: TimelineEvent[];
  activeMissions: Mission[];
}
