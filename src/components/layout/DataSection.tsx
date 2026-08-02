"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Database, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import {
  describeBundle,
  detectConflicts,
  downloadExport,
  exportAll,
  importBundle,
  ImportError,
  journalOnlyBundle,
  missionsOnlyBundle,
  readBundleFile,
  scopeBundleToWorkspace,
  type BundleSummary,
  type ImportConflicts,
  type ImportMode,
} from "@/lib/backup";
import { cn } from "@/lib/utils";
import type { ExportBundle } from "@/types";

interface Pending {
  bundle: ExportBundle;
  summary: BundleSummary;
  conflicts: ImportConflicts;
}

/**
 * The Data pane: full & scoped export, plus an import flow that previews what a
 * file contains, flags conflicts, and lets you choose merge (upsert, keep
 * everything else) or replace (wipe and restore) — a small recovery console.
 */
export function DataSection() {
  const { workspaces } = useWorkspaces();
  const [scope, setScope] = useState("all");
  const [pending, setPending] = useState<Pending | null>(null);
  const [result, setResult] = useState<{ mode: ImportMode; summary: BundleSummary } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const runExport = async () => {
    const full = await exportAll();
    if (scope === "all") return downloadExport(full, "backup");
    if (scope === "missions") return downloadExport(missionsOnlyBundle(full), "missions");
    if (scope === "journal") return downloadExport(journalOnlyBundle(full), "journal");
    const ws = workspaces.find((w) => w.id === scope);
    if (ws) {
      const slug = ws.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      downloadExport(scopeBundleToWorkspace(full, ws.id), `workspace-${slug || "export"}`);
    }
  };

  const onFile = async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const bundle = await readBundleFile(file);
      const conflicts = await detectConflicts(bundle);
      setPending({ bundle, summary: describeBundle(bundle), conflicts });
    } catch (err) {
      setError(err instanceof ImportError ? err.message : "Import failed.");
    }
  };

  const doImport = async (mode: ImportMode) => {
    if (!pending || busy) return;
    setBusy(true);
    const res = await importBundle(pending.bundle, mode);
    setBusy(false);
    setPending(null);
    setResult(res);
    setTimeout(() => setResult(null), 6000);
  };

  const conflictTotal = pending
    ? Object.values(pending.conflicts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Export */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="h-9 w-auto text-[14px]"
          options={[
            { value: "all", label: "Everything" },
            { value: "missions", label: "Missions only" },
            { value: "journal", label: "Journal only" },
            ...workspaces
              .filter((w) => !w.archived)
              .map((w) => ({ value: w.id, label: `Workspace: ${w.name}` })),
          ]}
        />
        <Button variant="secondary" size="sm" onClick={runExport}>
          <Download className="h-4 w-4" /> Export
        </Button>
        <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" /> Import
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-alert">
          <AlertTriangle className="h-4 w-4" /> {error}
        </p>
      )}

      {/* Import preview / recovery */}
      {pending && (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/50 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
            <Database className="h-4 w-4 text-accent" /> This file contains
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-muted">
            <Count n={pending.summary.days} label="days" />
            <Count n={pending.summary.tasks} label="tasks" />
            <Count n={pending.summary.missions} label="missions" />
            <Count n={pending.summary.workspaces} label="workspaces" />
            <Count n={pending.summary.notes} label="notes" />
            <Count n={pending.summary.resources} label="resources" />
            <Count n={pending.summary.journal} label="journal" />
          </div>

          {conflictTotal > 0 && (
            <p className="flex items-start gap-1.5 rounded-lg bg-warning/10 px-3 py-2 text-[13px] text-[#8A6100]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {conflictTotal} record{conflictTotal === 1 ? "" : "s"} already exist here.
              Merge keeps both (tasks are combined per day); Replace overwrites everything.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" disabled={busy} onClick={() => doImport("merge")}>
              Merge in
            </Button>
            <Button variant="danger" size="sm" disabled={busy} onClick={() => doImport("replace")}>
              Replace all
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {result && (
        <p className="text-sm text-success">
          {result.mode === "merge" ? "Merged" : "Restored"} {result.summary.days} days ·{" "}
          {result.summary.tasks} tasks · {result.summary.workspaces} workspaces.
        </p>
      )}
    </div>
  );
}

function Count({ n, label }: { n: number; label: string }) {
  return (
    <span className={cn(n === 0 && "text-ink-muted/50")}>
      <span className="font-medium text-ink">{n}</span> {label}
    </span>
  );
}
