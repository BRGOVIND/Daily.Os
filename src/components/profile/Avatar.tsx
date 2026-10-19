"use client";

import { initialsOf, type Profile } from "@/lib/profiles";
import { cn } from "@/lib/utils";

interface AvatarProps {
  profile: Pick<Profile, "name" | "emoji" | "color">;
  size?: number;
  className?: string;
}

function initialsColor(background: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(background)?.[1];
  if (!hex) return "#FFFFFF";
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return 1.05 / (luminance + 0.05) >= 4.5 ? "#FFFFFF" : "#17171B";
}

/** Circular avatar: emoji if set, otherwise generated initials on a tinted disc. */
export function Avatar({ profile, size = 44, className }: AvatarProps) {
  const fontSize = Math.round(size * (profile.emoji ? 0.5 : 0.36));
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize,
        color: profile.emoji ? undefined : initialsColor(profile.color),
        backgroundColor: profile.emoji ? "#FFFFFF" : profile.color,
        boxShadow: profile.emoji ? "inset 0 0 0 1px #F0E6EB" : undefined,
      }}
    >
      {profile.emoji ?? initialsOf(profile.name)}
    </span>
  );
}
