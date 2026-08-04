"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { spring } from "@/lib/motion";

interface FabProps {
  onClick: () => void;
  label?: string;
}

/** The one persistent action: a burgundy orb, bottom-right, that adds a task. */
export const Fab = memo(function Fab({ onClick, label = "Add task" }: FabProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ ...spring.soft, delay: 0.15 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[calc(1.25rem+env(safe-area-inset-right))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-glow transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 sm:bottom-[calc(2rem+env(safe-area-inset-bottom))] sm:right-[calc(2rem+env(safe-area-inset-right))]"
    >
      <Plus className="h-6 w-6" strokeWidth={2.4} />
    </motion.button>
  );
});
