"use client";

import { motion } from "framer-motion";
import { BarChart3, Search, Settings } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/profile/Avatar";
import { BrandMark } from "@/components/ui/BrandMark";
import { useProfile } from "@/components/profile/ProfileContext";

interface TopNavProps {
  monthTitle: string;
  onOpenSearch: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
}

/**
 * Deliberately spare top bar: identity on the left, the current month as a
 * quiet anchor in the centre, a few quiet actions on the right.
 */
export function TopNav({
  monthTitle,
  onOpenSearch,
  onOpenStats,
  onOpenSettings,
}: TopNavProps) {
  const { profile, isGuest } = useProfile();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark size={28} decorative />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            {APP_NAME}
          </span>
          {isGuest && (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8A6100]">
              Guest
            </span>
          )}
        </div>

        <motion.span
          key={monthTitle}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="hidden text-sm font-medium text-ink-muted sm:block"
        >
          {monthTitle}
        </motion.span>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search (press /)"
            onClick={onOpenSearch}
          >
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Insights"
            onClick={onOpenStats}
          >
            <BarChart3 className="h-[18px] w-[18px]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
            onClick={onOpenSettings}
          >
            <Settings className="h-[18px] w-[18px]" />
          </Button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={`${profile.name} — open profile & settings`}
            className="ml-1 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Avatar profile={profile} size={30} />
          </button>
        </div>
      </div>
    </header>
  );
}
