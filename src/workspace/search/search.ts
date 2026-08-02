/**
 * Module 4 — Universal Search.
 *
 * One instant, in-memory search across every entity type: workspaces, tasks,
 * habits, missions, notes, resources, journal and templates. Results come back
 * grouped by category, each capped for speed.
 */

import type {
  SearchCategory,
  SearchGroup,
  SearchHit,
  WorkspaceSnapshot,
} from "@/workspace/models/types";
import { notePlainText } from "@/workspace/notes/notes";
import { RESOURCE_KIND_MAP } from "@/lib/constants";
import { SEARCH_PER_CATEGORY, SEARCH_TOTAL } from "@/workspace/models/constants";

const CATEGORY_ORDER: SearchCategory[] = [
  "workspaces",
  "tasks",
  "missions",
  "notes",
  "resources",
  "journal",
  "habits",
  "templates",
];

const CATEGORY_LABEL: Record<SearchCategory, string> = {
  workspaces: "Workspaces",
  tasks: "Tasks",
  missions: "Missions",
  notes: "Notes",
  resources: "Resources",
  journal: "Journal",
  habits: "Habits",
  templates: "Templates",
};

/** Run a universal search and return non-empty groups in a stable order. */
export function universalSearch(
  snapshot: WorkspaceSnapshot,
  query: string,
): SearchGroup[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const byCategory = new Map<SearchCategory, SearchHit[]>();
  let total = 0;

  const push = (cat: SearchCategory, hit: SearchHit): boolean => {
    const list = byCategory.get(cat) ?? [];
    if (list.length >= SEARCH_PER_CATEGORY) return true; // category full
    list.push(hit);
    byCategory.set(cat, list);
    total += 1;
    return total < SEARCH_TOTAL;
  };

  const wsName = new Map(snapshot.workspaces.map((w) => [w.id, w.name] as const));

  // Workspaces
  for (const w of snapshot.workspaces) {
    if (`${w.name} ${w.description}`.toLowerCase().includes(q)) {
      if (!push("workspaces", {
        id: `ws-${w.id}`,
        category: "workspaces",
        title: w.name,
        subtitle: w.description || "Workspace",
        date: null,
        workspaceId: w.id,
        icon: w.icon,
        refId: w.id,
      })) return finalize(byCategory);
    }
  }

  // Tasks
  for (const { task, date } of snapshot.tasks) {
    if (`${task.title} ${task.notes} ${task.category}`.toLowerCase().includes(q)) {
      if (!push("tasks", {
        id: `task-${task.id}`,
        category: "tasks",
        title: task.title,
        subtitle: `${task.category} · ${date}`,
        date,
        workspaceId: task.workspaceId ?? null,
        icon: task.completed ? "✅" : "⭕",
        refId: task.id,
      })) return finalize(byCategory);
    }
  }

  // Missions
  for (const m of snapshot.missions) {
    if (`${m.title} ${m.description} ${m.category}`.toLowerCase().includes(q)) {
      if (!push("missions", {
        id: `mission-${m.id}`,
        category: "missions",
        title: m.title,
        subtitle: m.description || "Mission",
        date: null,
        workspaceId: m.workspaceId ?? null,
        icon: m.icon || "🚀",
        refId: m.id,
      })) return finalize(byCategory);
    }
  }

  // Notes
  for (const n of snapshot.notes) {
    if (`${n.title} ${notePlainText(n)}`.toLowerCase().includes(q)) {
      if (!push("notes", {
        id: `note-${n.id}`,
        category: "notes",
        title: n.title || "Untitled note",
        subtitle: wsName.get(n.workspaceId) ?? "Note",
        date: null,
        workspaceId: n.workspaceId,
        icon: "📝",
        refId: n.id,
      })) return finalize(byCategory);
    }
  }

  // Resources
  for (const r of snapshot.resources) {
    if (`${r.title} ${r.description} ${r.url} ${r.tags.join(" ")}`.toLowerCase().includes(q)) {
      if (!push("resources", {
        id: `resource-${r.id}`,
        category: "resources",
        title: r.title,
        subtitle: r.url || RESOURCE_KIND_MAP[r.kind].label,
        date: null,
        workspaceId: r.workspaceId,
        icon: RESOURCE_KIND_MAP[r.kind].icon,
        refId: r.id,
      })) return finalize(byCategory);
    }
  }

  // Journal
  for (const e of snapshot.journal) {
    const hay = `${e.highlights} ${e.challenges} ${e.lessons} ${e.reflection}`.toLowerCase();
    if (hay.includes(q)) {
      if (!push("journal", {
        id: `journal-${e.id}`,
        category: "journal",
        title: `Journal · ${e.date}`,
        subtitle: e.highlights || e.reflection || "Reflection",
        date: e.date,
        workspaceId: e.workspaceId,
        icon: "📓",
        refId: e.id,
      })) return finalize(byCategory);
    }
  }

  // Habits
  for (const h of snapshot.habits) {
    if (h.name.toLowerCase().includes(q)) {
      if (!push("habits", {
        id: `habit-${h.id}`,
        category: "habits",
        title: h.name,
        subtitle: "Habit",
        date: null,
        workspaceId: null,
        icon: "🔁",
        refId: h.id,
      })) return finalize(byCategory);
    }
  }

  // Templates
  for (const t of snapshot.templates) {
    if (t.name.toLowerCase().includes(q)) {
      if (!push("templates", {
        id: `template-${t.id}`,
        category: "templates",
        title: t.name,
        subtitle: `${t.items.length} tasks`,
        date: null,
        workspaceId: null,
        icon: t.icon || "🧩",
        refId: t.id,
      })) return finalize(byCategory);
    }
  }

  return finalize(byCategory);
}

function finalize(byCategory: Map<SearchCategory, SearchHit[]>): SearchGroup[] {
  return CATEGORY_ORDER.filter((c) => (byCategory.get(c)?.length ?? 0) > 0).map(
    (category) => ({
      category,
      label: CATEGORY_LABEL[category],
      hits: byCategory.get(category) ?? [],
    }),
  );
}
