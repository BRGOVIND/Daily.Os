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

/** The canvas colour of each theme — mirrors the CSS variables in globals.css.
 * Used to keep the browser/standalone chrome (`<meta name="theme-color">`) in
 * sync with the active theme so an installed app feels first-class. */
const THEME_CHROME: Record<AppSettings["theme"], string> = {
  light: "#FCF4F7",
  dark: "#17171B",
  paper: "#F4EDE0",
};

/** Activate a full theme by stamping `data-theme` on <html>; mirror to
 * localStorage so the no-flash boot script can restore it before paint, and
 * update the theme-color meta so the OS chrome matches. */
export function applyTheme(theme: AppSettings["theme"]): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme === "dark" ? "dark" : "light";
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_CHROME[theme] ?? THEME_CHROME.light;
  try {
    localStorage.setItem("daily-os-theme", theme);
  } catch {
    /* storage may be unavailable (private mode) — the app still themes live. */
  }
}

export interface UseSettingsResult {
  settings: AppSettings;
  loading: boolean;
  update: (patch: Partial<Omit<AppSettings, "id">>) => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const stored = useLiveQuery(() => db.settings.get("app"), []);
  const settings = stored ?? DEFAULT_SETTINGS;

  // Keep the live accent + theme in sync whenever settings change.
  useEffect(() => {
    applyAccent(settings.accent);
  }, [settings.accent]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  const update = useCallback(
    (patch: Partial<Omit<AppSettings, "id">>) => saveSettings(patch),
    [],
  );

  return { settings, loading: stored === undefined, update };
}
