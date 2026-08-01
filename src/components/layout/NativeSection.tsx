"use client";

import { useEffect, useState } from "react";
import { FolderOpen, MonitorSmartphone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  backupDir,
  isAutostartEnabled,
  isTauri,
  revealPath,
  setAutostart,
} from "@/lib/native/native";
import { SHORTCUT_GROUPS } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

/** Global shortcuts owned by the native shell (registered in Rust). */
const NATIVE_SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["Ctrl", "Shift", "Space"], label: "Quick capture" },
  { keys: ["Ctrl", "Shift", "D"], label: "Today's dashboard" },
  { keys: ["Ctrl", "Shift", "F"], label: "Focus mode" },
];

/**
 * The Desktop pane in Settings — visible only inside the Tauri shell. Governs
 * launch-at-login and the native backup folder; documents the tray, window
 * memory and global shortcuts the shell provides. A no-op (renders null) on web.
 */
export function NativeSection() {
  const [native, setNative] = useState(false);
  const [autostart, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNative(isTauri());
    if (isTauri()) void isAutostartEnabled().then(setAuto);
  }, []);

  if (!native) return null;

  const toggleAutostart = async () => {
    if (busy) return;
    setBusy(true);
    const next = !autostart;
    await setAutostart(next);
    setAuto(await isAutostartEnabled());
    setBusy(false);
  };

  const openBackups = async () => {
    const dir = await backupDir();
    if (dir) await revealPath(dir);
  };

  return (
    <section className="flex flex-col gap-3">
      <Label className="flex items-center gap-1.5">
        <MonitorSmartphone className="h-3.5 w-3.5" /> Desktop
      </Label>

      <Toggle
        title="Launch at login"
        description="Open Daily OS automatically when you sign in."
        checked={autostart}
        onChange={toggleAutostart}
      />

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-canvas/50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-ink">Backup folder</p>
          <p className="text-sm text-ink-muted">Reveal the native backup directory.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={openBackups}>
          <FolderOpen className="h-4 w-4" /> Open
        </Button>
      </div>

      <div className="rounded-2xl border border-line bg-canvas/50 px-4 py-3">
        <p className="mb-2 text-[13px] font-medium text-ink">Global shortcuts</p>
        <ul className="space-y-1.5">
          {NATIVE_SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-ink-muted">{s.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-md border border-line bg-card px-1.5 py-0.5 text-[11px] font-medium text-ink-muted"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[12px] text-ink-muted/70">
          The window remembers its size and position; the tray keeps Daily OS a
          click away. Press <kbd className="rounded border border-line px-1">?</kbd>{" "}
          for in-app shortcuts ({SHORTCUT_GROUPS.length} groups).
        </p>
      </div>
    </section>
  );
}

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-canvas/50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-ink">{title}</p>
        <p className="text-sm text-ink-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
            checked ? "right-0.5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
