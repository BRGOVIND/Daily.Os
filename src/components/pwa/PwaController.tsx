"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "daily-os-install-dismissed";

/**
 * Registers the service worker (production only) and surfaces a calm,
 * dismissible install prompt when the browser offers one.
 */
export function PwaController() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (localStorage.getItem(DISMISS_KEY)) return;
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-40 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-card p-3 pl-4 shadow-lift sm:bottom-8"
          role="dialog"
          aria-label="Install Daily OS"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Download className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Install Daily OS</p>
            <p className="text-[13px] text-ink-muted">
              Add it to your device for a full-screen, offline experience.
            </p>
          </div>
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover active:scale-[0.98]"
          >
            Install
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-black/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
