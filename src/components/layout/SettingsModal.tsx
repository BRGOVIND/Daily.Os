"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  Download,
  Palette,
  Trash2,
  Upload,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";
import { APP_NAME, ACCENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  notificationPermission,
  requestNotificationPermission,
} from "@/lib/notifications";
import {
  downloadExport,
  exportAll,
  importAll,
  ImportError,
  readBundleFile,
} from "@/lib/backup";
import { useSettings } from "@/hooks/useSettings";
import { TemplateManager } from "@/components/templates/TemplateManager";
import { ProfilesSection } from "@/components/profile/ProfilesSection";
import type { AccentKey } from "@/types";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, update } = useSettings();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = async () => {
    await Promise.all([
      db.days.clear(),
      db.habits.clear(),
      db.recurring.clear(),
    ]);
    setConfirming(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 2200);
  };

  const toggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const perm = await requestNotificationPermission();
      await update({ notificationsEnabled: perm === "granted" });
    } else {
      await update({ notificationsEnabled: false });
    }
  };

  const doExport = async () => {
    downloadExport(await exportAll());
  };

  const doImport = async (file: File) => {
    try {
      const bundle = await readBundleFile(file);
      await importAll(bundle);
      setImportMsg({ ok: true, text: `Imported ${bundle.days.length} days.` });
    } catch (err) {
      setImportMsg({
        ok: false,
        text: err instanceof ImportError ? err.message : "Import failed.",
      });
    }
    setTimeout(() => setImportMsg(null), 3500);
  };

  const permission = notificationPermission();

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirming(false);
        onOpenChange(o);
      }}
      title="Settings"
      variant="center"
      className="max-w-lg"
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col gap-7 overflow-y-auto p-6 sm:p-8">
        <header>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            {APP_NAME}
          </p>
          <h2 className="mt-1 font-display text-2xl font-light tracking-tight text-ink">
            Settings
          </h2>
        </header>

        <ProfilesSection />

        {/* Accent */}
        <section className="flex flex-col gap-3">
          <Label className="flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Accent color
          </Label>
          <div className="flex flex-wrap gap-2.5">
            {(Object.keys(ACCENTS) as AccentKey[]).map((key) => {
              const preset = ACCENTS[key];
              const active = settings.accent === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => update({ accent: key })}
                  aria-label={preset.label}
                  aria-pressed={active}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110",
                    active && "ring-2 ring-offset-2 ring-offset-card",
                  )}
                  style={{
                    boxShadow: active ? `0 0 0 2px ${preset.hex}` : undefined,
                  }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: preset.hex }}
                  >
                    {active && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Reminders / notifications */}
        <section className="flex flex-col gap-3">
          <Label className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Reminders
          </Label>
          <ToggleRow
            title="Browser notifications"
            description={
              permission === "denied"
                ? "Blocked in your browser settings."
                : "Task reminders and the 10 PM daily review."
            }
            checked={settings.notificationsEnabled}
            disabled={permission === "denied"}
            onChange={toggleNotifications}
          />
          <ToggleRow
            title="Daily review at 10 PM"
            description="A calm nudge to reflect and plan tomorrow."
            checked={settings.reviewEnabled}
            onChange={() => update({ reviewEnabled: !settings.reviewEnabled })}
          />
        </section>

        {/* Templates */}
        <section className="flex flex-col gap-3">
          <Label>Templates</Label>
          <TemplateManager />
        </section>

        {/* Data */}
        <section className="flex flex-col gap-3">
          <Label>Your data</Label>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={doExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void doImport(file);
                e.target.value = "";
              }}
            />
          </div>
          <AnimatePresence>
            {importMsg && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "text-sm",
                  importMsg.ok ? "text-success" : "text-alert",
                )}
              >
                {importMsg.text}
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* Theme placeholder */}
        <section className="flex items-center justify-between rounded-2xl border border-line bg-canvas/50 px-4 py-3">
          <div>
            <p className="text-[15px] font-medium text-ink">Dark theme</p>
            <p className="text-sm text-ink-muted">Coming soon.</p>
          </div>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            Soon
          </span>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-line p-4">
          <p className="text-[15px] font-medium text-ink">Reset all data</p>
          <p className="mt-1 text-sm text-ink-muted">
            Permanently delete every day, task and habit on this device.
          </p>
          <div className="mt-4">
            {cleared ? (
              <p className="text-sm font-medium text-success">
                All local data cleared.
              </p>
            ) : confirming ? (
              <div className="flex items-center gap-3">
                <Button variant="danger" onClick={reset}>
                  <Trash2 className="h-4 w-4" /> Yes, delete everything
                </Button>
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                <Trash2 className="h-4 w-4" /> Reset local data
              </Button>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-ink-muted/70">
          {APP_NAME} · Offline-first · Open source
        </p>
      </div>
    </Modal>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40",
          checked ? "bg-accent" : "bg-line",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm",
            checked ? "right-0.5" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}
