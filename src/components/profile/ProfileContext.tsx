"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/lib/profiles";

export interface ProfileContextValue {
  /** The active profile (may be the synthetic Guest profile). */
  profile: Profile;
  isGuest: boolean;
  /** All saved (non-guest) profiles. */
  profiles: Profile[];
  /** Switch to a saved profile and reload its workspace. */
  switchProfile: (id: string) => void;
  /** Enter temporary Guest mode. */
  continueAsGuest: () => void;
  /** Create a new profile and switch to it. `migrateGuest` moves current Guest data in. */
  createProfile: (name: string, opts?: { migrateGuest?: boolean }) => void;
  renameProfile: (id: string, name: string) => void;
  deleteProfile: (id: string) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export const ProfileProvider = ProfileContext.Provider;

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
