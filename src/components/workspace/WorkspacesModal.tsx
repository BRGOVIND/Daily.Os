"use client";

import { useEffect, useState } from "react";
import { Archive, ArchiveRestore, LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useWorkspaceData } from "@/hooks/useWorkspaceData";
import { COLOR_MAP, DEFAULT_WORKSPACE_ID } from "@/lib/constants";
import { toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import { WORKSPACE_TABS, type WorkspaceTab } from "./tabs";
import { CreateWorkspace } from "./CreateWorkspace";
import { WorkspaceDashboard } from "./WorkspaceDashboard";
import { NotesTab } from "./NotesTab";
import { ResourcesTab } from "./ResourcesTab";
import { JournalTab } from "./JournalTab";
import { TimelineTab } from "./TimelineTab";
import { GraphTab } from "./GraphTab";
import { StatsTab } from "./StatsTab";
import { ShareTab } from "@/components/collab/ShareTab";

interface WorkspacesModalProps {
  open: boolean;
  today: Date | null;
  onOpenChange: (open: boolean) => void;
  onOpenDay: (key: string) => void;
}

/**
 * Workspace OS hub — the container that everything revolves around. A switcher
 * across the top, then Dashboard / Notes / Resources / Journal / Timeline /
 * Graph / Stats tabs, all scoped to the active workspace and built by the
 * offline workspace domain.
 */
export function WorkspacesModal({ open, today, onOpenChange, onOpenDay }: WorkspacesModalProps) {
  const { workspaces, active, activeId, setActive, create, update, remove } = useWorkspaces();
  const [tab, setTab] = useState<WorkspaceTab>("dashboard");
  const [mode, setMode] = useState<"none" | "create" | "edit">("none");
  // Two-step confirm for the cascading workspace delete (removes notes,
  // resources and journal). Reset whenever the active workspace changes.
  const [confirmDelete, setConfirmDelete] = useState(false);

  const todayKey = today ? toDateKey(today) : null;
  const data = useWorkspaceData(active, todayKey, open);

  // Reset to the dashboard whenever the active workspace changes.
  useEffect(() => {
    setTab("dashboard");
    setMode("none");
    setConfirmDelete(false);
  }, [activeId]);

  const openDay = (key: string) => {
    onOpenChange(false);
    onOpenDay(key);
  };

  const activeList = workspaces.filter((w) => !w.archived);
  const archivedList = workspaces.filter((w) => w.archived);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Workspaces"
      description="Your personal operating system"
      variant="sheet"
      className="max-w-3xl"
    >
      <div className="flex max-h-[94dvh] flex-col sm:max-h-[calc(100dvh-3rem)]">
        {/* Header */}
        <div className="shrink-0 px-6 pb-3 pt-9 sm:px-10 sm:pt-10">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            <LayoutGrid className="h-3.5 w-3.5" /> Workspace OS
          </p>
          <div className="mt-1 flex items-center gap-3">
            {active && <span className="text-3xl">{active.icon}</span>}
            <div className="min-w-0">
              <h2 className="truncate font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
                {active?.name ?? "Workspaces"}
              </h2>
              {active?.description && (
                <p className="mt-0.5 truncate text-[13px] text-ink-muted">{active.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Workspace switcher */}
        <div className="shrink-0 px-6 sm:px-10">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            {activeList.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setActive(w.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                  w.id === activeId
                    ? "border-transparent text-white"
                    : "border-line text-ink-muted hover:border-ink/20",
                )}
                style={w.id === activeId ? { backgroundColor: COLOR_MAP[w.color].dot } : undefined}
              >
                <span>{w.icon}</span>
                <span className="max-w-[9rem] truncate">{w.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMode(mode === "create" ? "none" : "create")}
              aria-label="New workspace"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-line text-ink-muted transition-colors hover:border-accent hover:text-accent"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        {mode === "none" && (
          <div className="shrink-0 border-b border-line px-6 sm:px-10">
            <div className="flex items-center gap-1 overflow-x-auto">
              {WORKSPACE_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "shrink-0 border-b-2 px-2.5 py-2.5 text-[13px] font-medium transition-colors",
                    tab === t.key
                      ? "border-accent text-ink"
                      : "border-transparent text-ink-muted hover:text-ink",
                  )}
                >
                  {t.label}
                </button>
              ))}
              {active && (
                <>
                  <div className="flex-1" />
                  <button
                    type="button"
                    aria-label="Edit workspace"
                    onClick={() => setMode("edit")}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted/60 transition-colors hover:bg-canvas hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 sm:px-10">
          {mode === "create" && (
            <CreateWorkspace
              onSubmit={async (input) => {
                const id = await create(input);
                await setActive(id);
                setMode("none");
              }}
              onCancel={() => setMode("none")}
            />
          )}

          {mode === "edit" && active && (
            <div className="space-y-4">
              <CreateWorkspace
                initial={active}
                onSubmit={async (input) => {
                  await update(active.id, input);
                  setMode("none");
                }}
                onCancel={() => setMode("none")}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => update(active.id, { archived: !active.archived })}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-ink/20 hover:text-ink"
                >
                  {active.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  {active.archived ? "Unarchive" : "Archive"}
                </button>
                {active.id !== DEFAULT_WORKSPACE_ID &&
                  (confirmDelete ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          setConfirmDelete(false);
                          await remove(active.id);
                          setMode("none");
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-[#C13030] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#a82828]"
                      >
                        <Trash2 className="h-4 w-4" /> Delete permanently
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="rounded-full px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:bg-accent/10 hover:text-accent"
                    >
                      <Trash2 className="h-4 w-4" /> Delete workspace
                    </button>
                  ))}
              </div>
              <p className="text-[12px] text-ink-muted/70">
                Deleting removes this workspace&rsquo;s notes, resources and journal. Its tasks and
                missions are kept and moved to your default workspace.
              </p>
            </div>
          )}

          {mode === "none" && active && data.dashboard && data.graph && data.stats && todayKey && (
            <>
              {tab === "dashboard" && (
                <WorkspaceDashboard data={data.dashboard} onOpenTab={setTab} onOpenDay={openDay} />
              )}
              {tab === "notes" && <NotesTab workspaceId={activeId} />}
              {tab === "resources" && <ResourcesTab workspaceId={activeId} />}
              {tab === "journal" && <JournalTab workspaceId={activeId} todayKey={todayKey} />}
              {tab === "timeline" && <TimelineTab events={data.timeline} onOpenDay={openDay} />}
              {tab === "graph" && <GraphTab graph={data.graph} />}
              {tab === "stats" && <StatsTab stats={data.stats} todayKey={todayKey} />}
              {tab === "share" && <ShareTab workspaceId={activeId} />}
            </>
          )}

          {archivedList.length > 0 && mode === "none" && tab === "dashboard" && (
            <div className="mt-6 border-t border-line pt-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted/70">
                Archived workspaces
              </p>
              <div className="flex flex-wrap gap-1.5">
                {archivedList.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setActive(w.id)}
                    className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-muted opacity-70 transition-colors hover:opacity-100"
                  >
                    <span>{w.icon}</span> {w.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
