"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/profiles";

interface ProfileCardProps {
  profile: Profile;
  selected?: boolean;
  onSelect: () => void;
}

/** A premium, selectable profile card: avatar, name, created + last-opened. */
export function ProfileCard({ profile, selected, onSelect }: ProfileCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        selected ? "border-accent/40 ring-2 ring-accent/20" : "border-line hover:border-ink/15",
      )}
    >
      <Avatar profile={profile} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold text-ink">{profile.name}</p>
        <p className="text-[13px] text-ink-muted">
          Opened {formatDistanceToNow(profile.lastOpenedAt, { addSuffix: true })}
        </p>
      </div>
    </motion.button>
  );
}
