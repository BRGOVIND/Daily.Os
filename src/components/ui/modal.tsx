"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { spring, transition } from "@/lib/motion";

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
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-scrim/20 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition.base}
              />
            </Dialog.Overlay>

            <div
              className={cn(
                "fixed inset-0 z-50 flex justify-center overflow-y-auto",
                variant === "center"
                  ? "items-center p-4"
                  : // Bottom sheet on phones, top-anchored panel on desktop.
                    "items-end p-0 sm:items-start sm:p-6",
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
                  transition={spring.soft}
                  className={cn(
                    "relative bg-card outline-none",
                    variant === "center"
                      ? "w-full max-w-lg rounded-3xl shadow-lift"
                      : "w-full max-w-3xl rounded-t-3xl rounded-b-none shadow-lift max-h-[94dvh] sm:max-h-none sm:rounded-3xl",
                    className,
                  )}
                >
                  {variant === "sheet" && (
                    // Grab handle — a familiar bottom-sheet affordance on touch,
                    // hidden on desktop where the sheet reads as a panel.
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-2 z-10 mx-auto h-1.5 w-10 rounded-full bg-ink/15 sm:hidden"
                    />
                  )}
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
                      className="touch-target absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
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
