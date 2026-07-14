"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface FabProps {
  onClick: () => void;
  label?: string;
}

/** The one persistent action: a burgundy orb, bottom-right, that adds a task. */
export function Fab({ onClick, label = "Add task" }: FabProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 24, delay: 0.15 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-glow transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/30 sm:bottom-8 sm:right-8"
    >
      <Plus className="h-6 w-6" strokeWidth={2.4} />
    </motion.button>
  );
}
