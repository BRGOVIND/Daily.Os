"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Plus, UserRound } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { BrandMark } from "@/components/ui/BrandMark";
import type { Profile } from "@/lib/profiles";

interface ProfilePickerProps {
  profiles: Profile[];
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onGuest: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Shown when multiple profiles exist: choose who's here. */
export function ProfilePicker({
  profiles,
  onSelect,
  onCreate,
  onGuest,
}: ProfilePickerProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <BrandMark size={32} decorative />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            {APP_NAME}
          </span>
        </div>

        <h1 className="mb-6 text-center font-display text-3xl font-light tracking-tight text-ink">
          Who&rsquo;s here?
        </h1>

        <div className="flex flex-col gap-3">
          {profiles.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
            >
              <ProfileCard profile={p} onSelect={() => onSelect(p.id)} />
            </motion.div>
          ))}
        </div>

        <AnimatePresence initial={false} mode="wait">
          {creating ? (
            <motion.form
              key="create"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) onCreate(name.trim());
              }}
              className="mt-3 flex gap-2 overflow-hidden"
            >
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New profile name"
                aria-label="New profile name"
                maxLength={40}
              />
              <button
                type="submit"
                disabled={!name.trim()}
                aria-label="Create profile"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.form>
          ) : (
            <motion.button
              key="add"
              type="button"
              onClick={() => setCreating(true)}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-line p-4 text-left text-ink-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-[15px] font-medium">Add a profile</span>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onGuest}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            <UserRound className="h-3.5 w-3.5" /> Continue as Guest
          </button>
        </div>
      </motion.div>
    </div>
  );
}
