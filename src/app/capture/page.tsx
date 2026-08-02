"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";
import { db } from "@/lib/db";
import { commitTask } from "@/lib/commitTask";
import { toDateKey } from "@/lib/date";
import { closeSelf, isTauri } from "@/lib/native/native";
import { CATEGORIES, ESTIMATE_OPTIONS, PRIORITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Mission, Priority, TaskColor, Workspace } from "@/types";

/**
 * Quick Capture — the tiny always-on-top window the native shell opens with a
 * global shortcut. It writes through the same `commitTask` path as the main app
 * (shared IndexedDB), so a capture appears instantly in today's workspace.
 * Renders as an ordinary route in the browser too.
 */
export default function CapturePage() {
  const [title, setTitle] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [missionId, setMissionId] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [minutes, setMinutes] = useState<number>(30);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const [ws, ms, settings] = await Promise.all([
        db.workspaces.toArray(),
        db.missions.toArray(),
        db.settings.get("app"),
      ]);
      const active = ws.filter((w) => !w.archived);
      setWorkspaces(active);
      setMissions(ms.filter((m) => !m.archived));
      setWorkspaceId(settings?.activeWorkspaceId ?? active[0]?.id ?? "");
    })();
  }, []);

  // Esc closes the floating window.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void closeSelf();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const missionOptions = useMemo(
    () => missions.filter((m) => !workspaceId || (m.workspaceId ?? "") === workspaceId || !m.workspaceId),
    [missions, workspaceId],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    await commitTask(toDateKey(new Date()), {
      title: title.trim(),
      priority,
      category: CATEGORIES[0],
      color: "slate" as TaskColor,
      notes: "",
      recurrence: "none",
      reminderAt: null,
      estimatedMinutes: minutes,
      missionId: missionId || null,
      workspaceId: workspaceId || null,
    });
    setSaving(false);

    if (isTauri()) {
      await closeSelf();
      return;
    }
    // In the browser there's no window to close — confirm and reset.
    setTitle("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <main className="flex min-h-dvh flex-col bg-canvas p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Zap className="h-4 w-4" />
        </span>
        <p className="text-[13px] font-semibold text-ink">Quick capture</p>
        {saved && <span className="ml-auto text-[12px] text-success">Saved ✓</span>}
      </div>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted/60 focus:border-accent/50 focus:outline-none focus:ring-4 focus:ring-accent/10"
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="h-9 rounded-lg border border-line bg-card px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none"
          >
            {workspaces.length === 0 && <option value="">Default</option>}
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.icon} {w.name}</option>
            ))}
          </select>
          <select
            value={missionId}
            onChange={(e) => setMissionId(e.target.value)}
            className="h-9 rounded-lg border border-line bg-card px-2 text-[13px] text-ink focus:border-accent/50 focus:outline-none"
          >
            <option value="">No mission</option>
            {missionOptions.map((m) => (
              <option key={m.id} value={m.id}>{m.icon} {m.title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPriority(p.key)}
              aria-pressed={priority === p.key}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                priority === p.key ? "border-accent bg-accent/10 text-ink" : "border-line text-ink-muted",
              )}
            >
              {p.label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-line" />
          {ESTIMATE_OPTIONS.map((o) => (
            <button
              key={o.minutes}
              type="button"
              onClick={() => setMinutes(o.minutes)}
              aria-pressed={minutes === o.minutes}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                minutes === o.minutes ? "border-accent bg-accent/10 text-ink" : "border-line text-ink-muted",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-ink-muted/70">Enter to save · Esc to close</span>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            Add task
          </button>
        </div>
      </form>
    </main>
  );
}
