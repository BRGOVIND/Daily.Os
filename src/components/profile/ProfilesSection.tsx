"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { useProfile } from "./ProfileContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/** Profile switcher inside Settings: switch, create, rename, delete, guest. */
export function ProfilesSection() {
  const {
    profile,
    isGuest,
    profiles,
    switchProfile,
    continueAsGuest,
    createProfile,
    renameProfile,
    deleteProfile,
  } = useProfile();

  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(profile.name);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [migrate, setMigrate] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const others = profiles.filter((p) => p.id !== profile.id);

  const submitRename = () => {
    if (renameVal.trim()) renameProfile(profile.id, renameVal.trim());
    setRenaming(false);
  };

  const submitCreate = () => {
    if (!newName.trim()) return;
    createProfile(newName.trim(), { migrateGuest: isGuest && migrate });
    setNewName("");
    setCreating(false);
  };

  return (
    <section className="flex flex-col gap-3">
      <Label className="flex items-center gap-1.5">
        <UserRound className="h-3.5 w-3.5" /> Profile
      </Label>

      {/* Active profile */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/50 p-3">
        <Avatar profile={profile} size={44} />
        <div className="min-w-0 flex-1">
          {renaming && !isGuest ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitRename();
              }}
              className="flex gap-2"
            >
              <Input
                autoFocus
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                aria-label="Profile name"
                maxLength={40}
                className="h-9"
              />
              <button
                type="submit"
                aria-label="Save name"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white"
              >
                <Check className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <p className="truncate text-[15px] font-semibold text-ink">
                {profile.name}
              </p>
              {isGuest && (
                <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6100]">
                  Guest
                </span>
              )}
              {!isGuest && (
                <button
                  type="button"
                  onClick={() => {
                    setRenameVal(profile.name);
                    setRenaming(true);
                  }}
                  aria-label="Rename profile"
                  className="text-ink-muted/60 transition-colors hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <p className="text-[13px] text-ink-muted">
            {isGuest ? "Temporary workspace — nothing is saved" : "This device only"}
          </p>
        </div>
      </div>

      {/* Switch to another profile */}
      {others.length > 0 && (
        <div className="flex flex-col gap-2">
          {others.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-card p-2.5"
            >
              <button
                type="button"
                onClick={() => switchProfile(p.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <Avatar profile={p} size={36} />
                <span className="truncate text-sm font-medium text-ink">{p.name}</span>
              </button>
              {confirmDelete === p.id ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      void deleteProfile(p.id);
                      setConfirmDelete(null);
                    }}
                    className="rounded-full bg-alert/10 px-2 py-1 text-[12px] font-medium text-alert"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(null)}
                    aria-label="Cancel"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted hover:bg-black/5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(p.id)}
                  aria-label={`Delete ${p.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted/50 transition-colors hover:bg-alert/10 hover:text-alert"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / guest actions */}
      <AnimatePresence initial={false} mode="wait">
        {creating ? (
          <motion.form
            key="create"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              submitCreate();
            }}
            className="flex flex-col gap-2 overflow-hidden rounded-2xl border border-line bg-canvas/50 p-3"
          >
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New profile name"
              aria-label="New profile name"
              maxLength={40}
            />
            {isGuest && (
              <label className="flex items-center gap-2 px-1 text-[13px] text-ink-muted">
                <input
                  type="checkbox"
                  checked={migrate}
                  onChange={(e) => setMigrate(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                Move current Guest data into this profile
              </label>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={submitCreate}>
                Create profile
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="actions" className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> {isGuest ? "Save as profile" : "New profile"}
            </Button>
            {!isGuest && (
              <Button variant="ghost" size="sm" onClick={continueAsGuest}>
                <UserRound className="h-4 w-4" /> Continue as Guest
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
