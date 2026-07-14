"use client";

import { useCallback, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, saveSettings } from "@/lib/db";
import { ACCENTS, DEFAULT_SETTINGS } from "@/lib/constants";
import type { AppSettings } from "@/types";

/** Push the chosen accent into CSS variables consumed by Tailwind tokens. */
export function applyAccent(accent: AppSettings["accent"]): void {
  const preset = ACCENTS[accent] ?? ACCENTS.burgundy;
  const root = document.documentElement;
  root.style.setProperty("--accent", preset.base);
  root.style.setProperty("--accent-hover", preset.hover);
}

export interface UseSettingsResult {
  settings: AppSettings;
  loading: boolean;
  update: (patch: Partial<Omit<AppSettings, "id">>) => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const stored = useLiveQuery(() => db.settings.get("app"), []);
  const settings = stored ?? DEFAULT_SETTINGS;

  // Keep the live accent in sync whenever settings change.
  useEffect(() => {
    applyAccent(settings.accent);
  }, [settings.accent]);

  const update = useCallback(
    (patch: Partial<Omit<AppSettings, "id">>) => saveSettings(patch),
    [],
  );

  return { settings, loading: stored === undefined, update };
}
