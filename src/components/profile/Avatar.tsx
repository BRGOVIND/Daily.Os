"use client";

import { initialsOf, type Profile } from "@/lib/profiles";
import { cn } from "@/lib/utils";

interface AvatarProps {
  profile: Pick<Profile, "name" | "emoji" | "color">;
  size?: number;
  className?: string;
}

/** Circular avatar: emoji if set, otherwise generated initials on a tinted disc. */
export function Avatar({ profile, size = 44, className }: AvatarProps) {
  const fontSize = Math.round(size * (profile.emoji ? 0.5 : 0.36));
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        backgroundColor: profile.emoji ? "#FFFFFF" : profile.color,
        boxShadow: profile.emoji ? "inset 0 0 0 1px #F0E6EB" : undefined,
      }}
    >
      {profile.emoji ?? initialsOf(profile.name)}
    </span>
  );
}
