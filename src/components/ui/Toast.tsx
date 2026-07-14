"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

interface ToastProps {
  message: string | null;
}

/** A single, transient confirmation toast, bottom-centered. */
export function Toast({ message }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lift"
        >
          <Check className="h-4 w-4 text-success" strokeWidth={3} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
