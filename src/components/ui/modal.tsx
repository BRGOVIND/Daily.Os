"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalVariant = "center" | "sheet";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  /** Accessible title; visually hidden unless rendered inside children. */
  title: string;
  description?: string;
  variant?: ModalVariant;
  className?: string;
  showClose?: boolean;
}

const contentVariants: Record<ModalVariant, Variants> = {
  center: {
    initial: { opacity: 0, scale: 0.96, y: 12 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.97, y: 8 },
  },
  sheet: {
    initial: { opacity: 0, y: 40, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 30, scale: 0.99 },
  },
};

/**
 * Accessible, animated modal. Radix handles focus trapping, ESC, aria and
 * scroll-lock; Framer Motion handles the enter/exit choreography via
 * forceMount + AnimatePresence.
 */
export function Modal({
  open,
  onOpenChange,
  children,
  title,
  description,
  variant = "center",
  className,
  showClose = true,
}: ModalProps) {
  const spring = { type: "spring", stiffness: 320, damping: 32, mass: 0.9 } as const;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            <div
              className={cn(
                "fixed inset-0 z-50 flex justify-center overflow-y-auto",
                variant === "center"
                  ? "items-center p-4"
                  : "items-start p-0 sm:p-6",
              )}
            >
              <Dialog.Content
                asChild
                forceMount
                onOpenAutoFocus={(e) => {
                  // Let inner inputs manage their own focus for sheets.
                  if (variant === "sheet") e.preventDefault();
                }}
              >
                <motion.div
                  variants={contentVariants[variant]}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={spring}
                  className={cn(
                    "relative bg-card outline-none",
                    variant === "center"
                      ? "w-full max-w-lg rounded-3xl shadow-lift"
                      : "w-full max-w-3xl rounded-none sm:rounded-3xl shadow-lift min-h-full sm:min-h-0",
                    className,
                  )}
                >
                  <Dialog.Title className="sr-only">{title}</Dialog.Title>
                  {description ? (
                    <Dialog.Description className="sr-only">
                      {description}
                    </Dialog.Description>
                  ) : (
                    <Dialog.Description className="sr-only">
                      {title}
                    </Dialog.Description>
                  )}

                  {showClose && (
                    <Dialog.Close
                      aria-label="Close"
                      className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <X className="h-5 w-5" />
                    </Dialog.Close>
                  )}

                  {children}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
