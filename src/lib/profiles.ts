import { createId } from "@/lib/utils";

/**
 * Lightweight, device-local profiles. NOT authentication — just named,
 * isolated workspaces. Each profile owns its own IndexedDB database, so data
 * never leaks between profiles. The registry itself lives in localStorage.
 */

export interface Profile {
  id: string;
  name: string;
  /** Optional emoji avatar; falls back to generated initials. */
  emoji: string | null;
  /** Avatar background (hex), derived at creation. */
  color: string;
  /** IndexedDB database name backing this profile. */
  dbName: string;
  createdAt: number;
  lastOpenedAt: number;
}

interface Registry {
  version: 1;
  onboarded: boolean;
  activeId: string | null;
  profiles: Profile[];
}

export const STORAGE_KEY = "daily-os:profiles";
export const LEGACY_DB = "daily-os";
export const GUEST_DB = "daily-os-guest";
export const GUEST_ID = "guest";

const AVATAR_COLORS = [
  "#C13E6B",
  "#8C1232",
  "#6F2D5C",
  "#1F684A",
  "#3E4494",
  "#B5760F",
  "#3B82C4",
  "#7C5CBF",
];

const EMPTY: Registry = { version: 1, onboarded: false, activeId: null, profiles: [] };

function read(): Registry {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Registry;
    if (!parsed || !Array.isArray(parsed.profiles)) return { ...EMPTY };
    return { ...EMPTY, ...parsed };
  } catch {
    return { ...EMPTY };
  }
}

function write(reg: Registry): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reg));
}

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/** Two-letter initials from a name (used when no emoji avatar is set). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function listProfiles(): Profile[] {
  return read().profiles;
}

export function getRegistryState(): { onboarded: boolean; activeId: string | null } {
  const r = read();
  return { onboarded: r.onboarded, activeId: r.activeId };
}

export function getProfile(id: string | null): Profile | null {
  if (!id) return null;
  return read().profiles.find((p) => p.id === id) ?? null;
}

/**
 * The db name that should be active at cold start, read synchronously so the
 * Dexie instance opens the correct database immediately. Guest is never
 * restored across reloads.
 */
export function initialDbName(): string {
  const r = read();
  if (!r.activeId) return LEGACY_DB;
  const p = r.profiles.find((x) => x.id === r.activeId);
  return p?.dbName ?? LEGACY_DB;
}

export function createProfile(input: {
  name: string;
  emoji?: string | null;
  adoptLegacy?: boolean;
}): Profile {
  const reg = read();
  const id = createId();
  // The very first profile can adopt the pre-existing "daily-os" database so
  // no prior data is lost; later profiles get their own isolated database.
  const dbName =
    input.adoptLegacy && reg.profiles.length === 0 ? LEGACY_DB : `daily-os-${id}`;
  const now = Date.now();
  const profile: Profile = {
    id,
    name: input.name.trim() || "Me",
    emoji: input.emoji ?? null,
    color: colorFor(id),
    dbName,
    createdAt: now,
    lastOpenedAt: now,
  };
  reg.profiles.push(profile);
  reg.activeId = id;
  reg.onboarded = true;
  write(reg);
  return profile;
}

export function renameProfile(id: string, name: string): void {
  const reg = read();
  const p = reg.profiles.find((x) => x.id === id);
  if (p) {
    p.name = name.trim() || p.name;
    write(reg);
  }
}

export function setActiveProfile(id: string | null): void {
  const reg = read();
  reg.activeId = id;
  if (id) {
    const p = reg.profiles.find((x) => x.id === id);
    if (p) p.lastOpenedAt = Date.now();
    reg.onboarded = true;
  }
  write(reg);
}

/** Remove a profile from the registry. Deleting its database is done by the caller. */
export function removeProfile(id: string): Profile | null {
  const reg = read();
  const idx = reg.profiles.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const [removed] = reg.profiles.splice(idx, 1);
  if (reg.activeId === id) reg.activeId = null;
  write(reg);
  return removed;
}

/** Synthetic profile object for Guest mode (never persisted to the registry). */
export function guestProfile(): Profile {
  return {
    id: GUEST_ID,
    name: "Guest",
    emoji: "👋",
    color: "#6B646A",
    dbName: GUEST_DB,
    createdAt: Date.now(),
    lastOpenedAt: Date.now(),
  };
}
