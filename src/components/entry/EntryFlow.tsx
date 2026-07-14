"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppShell } from "@/components/AppShell";
import { BrandMark } from "@/components/ui/BrandMark";
import { Hero } from "./Hero";
import { Onboarding } from "./Onboarding";
import { ProfilePicker } from "./ProfilePicker";
import { ProfileProvider, type ProfileContextValue } from "@/components/profile/ProfileContext";
import {
  clearDatabase,
  copyDatabase,
  deleteDatabase,
  switchActiveDatabase,
} from "@/lib/db";
import {
  GUEST_DB,
  GUEST_ID,
  createProfile as createProfileRecord,
  getProfile,
  getRegistryState,
  guestProfile,
  listProfiles,
  removeProfile,
  renameProfile as renameProfileRecord,
  setActiveProfile as persistActiveProfile,
  type Profile,
} from "@/lib/profiles";

type Step = "boot" | "onboarding" | "picker" | "hero" | "dashboard";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The premium entry experience and local-profile orchestrator. Decides between
 * onboarding, the profile picker and the hero screen, then unfolds into the
 * dashboard. Owns profile state and the switchable database, remounting the
 * dashboard (by db name) so every profile is a completely isolated workspace.
 */
export function EntryFlow() {
  const [step, setStep] = useState<Step>("boot");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [active, setActive] = useState<Profile | null>(null);
  const [heroAuto, setHeroAuto] = useState(false);
  const [switching, setSwitching] = useState(false);
  const booted = useRef(false);

  /** Switch the underlying database, then land on hero or the dashboard. */
  const enterProfile = useCallback(
    async (
      profile: Profile,
      opts: { viaHero?: boolean; auto?: boolean } = {},
    ) => {
      setSwitching(true);
      await switchActiveDatabase(profile.dbName);
      persistActiveProfile(profile.id === GUEST_ID ? null : profile.id);
      setActive(profile);
      setHeroAuto(opts.auto ?? false);
      setSwitching(false);
      setStep(opts.viaHero ? "hero" : "dashboard");
    },
    [],
  );

  // Boot: decide the initial screen from the local registry.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const { onboarded } = getRegistryState();
    const list = listProfiles();
    setProfiles(list);

    if (list.length > 1) {
      setStep("picker");
    } else if (list.length === 1) {
      void enterProfile(list[0], { viaHero: true, auto: true });
    } else if (onboarded) {
      // Onboarded before, but all profiles were deleted.
      setStep("onboarding");
    } else {
      setStep("onboarding");
    }
  }, [enterProfile]);

  const startGuest = useCallback(async () => {
    // Guest always begins as a clean, temporary workspace.
    await clearDatabase(GUEST_DB);
    await enterProfile(guestProfile(), { viaHero: true });
  }, [enterProfile]);

  const onboardingCreate = useCallback(
    async (name: string) => {
      const p = createProfileRecord({ name, adoptLegacy: true });
      setProfiles(listProfiles());
      await enterProfile(p, { viaHero: true });
    },
    [enterProfile],
  );

  const pickerCreate = useCallback(
    async (name: string) => {
      const p = createProfileRecord({ name, adoptLegacy: false });
      setProfiles(listProfiles());
      await enterProfile(p, { viaHero: true });
    },
    [enterProfile],
  );

  // ---- Context actions used from inside the dashboard (Settings) ----------
  const ctx = useMemo<ProfileContextValue | null>(() => {
    if (!active) return null;
    return {
      profile: active,
      isGuest: active.id === GUEST_ID,
      profiles,
      switchProfile: (id) => {
        const p = getProfile(id);
        if (p) void enterProfile(p, { viaHero: false });
      },
      continueAsGuest: () => void startGuest(),
      createProfile: async (name, opts) => {
        const wasGuest = active.id === GUEST_ID;
        const p = createProfileRecord({ name, adoptLegacy: false });
        if (opts?.migrateGuest && wasGuest) {
          await copyDatabase(GUEST_DB, p.dbName);
        }
        setProfiles(listProfiles());
        await enterProfile(p, { viaHero: false });
        if (opts?.migrateGuest && wasGuest) await clearDatabase(GUEST_DB);
      },
      renameProfile: (id, name) => {
        renameProfileRecord(id, name);
        const list = listProfiles();
        setProfiles(list);
        if (active.id === id) {
          setActive(list.find((p) => p.id === id) ?? active);
        }
      },
      deleteProfile: async (id) => {
        if (id === active.id) return; // active profile can't be deleted
        const removed = removeProfile(id);
        setProfiles(listProfiles());
        if (removed) await deleteDatabase(removed.dbName);
      },
    };
  }, [active, profiles, enterProfile, startGuest]);

  return (
    <>
      <AnimatePresence mode="wait">
        {step === "boot" || switching ? (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-dvh items-center justify-center bg-canvas"
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.98, 1, 0.98] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <BrandMark size={44} decorative />
            </motion.div>
          </motion.div>
        ) : step === "onboarding" ? (
          <motion.div key="onboarding" exit={{ opacity: 0, y: -8 }}>
            <Onboarding onCreate={onboardingCreate} onGuest={startGuest} />
          </motion.div>
        ) : step === "picker" ? (
          <motion.div key="picker" exit={{ opacity: 0, y: -8 }}>
            <ProfilePicker
              profiles={profiles}
              onSelect={(id) => {
                const p = getProfile(id);
                if (p) void enterProfile(p, { viaHero: true });
              }}
              onCreate={pickerCreate}
              onGuest={startGuest}
            />
          </motion.div>
        ) : step === "hero" && active ? (
          <motion.div
            key="hero"
            exit={{ opacity: 0, scale: 1.04, filter: "blur(4px)" }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Hero
              profile={active}
              isGuest={active.id === GUEST_ID}
              autoAdvance={heroAuto}
              onStart={() => setStep("dashboard")}
            />
          </motion.div>
        ) : step === "dashboard" && active && ctx ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 28, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <ProfileProvider value={ctx}>
              <AppShell key={active.dbName} />
            </ProfileProvider>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
