"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { spring } from "@/lib/motion";
import { Download, Share, Plus, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "daily-os-install-dismissed";
const IOS_DISMISS_KEY = "daily-os-ios-hint-dismissed";

/** iOS (iPhone/iPad) can't fire `beforeinstallprompt`; installation is manual
 * via Share → Add to Home Screen. Detect it so we show guidance, never a button
 * that would do nothing. */
function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPhone = /iPhone|iPod|iPad/i.test(ua);
  // iPadOS 13+ reports as MacIntel with touch support.
  const iPadDesktop =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iPhone || iPadDesktop;
}

/**
 * Registers the service worker (production only) and surfaces a calm,
 * dismissible install prompt when the browser offers one.
 */
export function PwaController() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Already installed (launched standalone, or iOS home-screen)? Never nudge.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      // The browser only fires this when the app genuinely qualifies for
      // installation (valid manifest + service worker + HTTPS + engagement),
      // so the banner surfaces only when Install will actually work.
      e.preventDefault();
      if (localStorage.getItem(DISMISS_KEY)) return;
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      // Chrome installed it via the browser UI (or our button) — retire the nudge.
      setVisible(false);
      setDeferred(null);
      localStorage.setItem(DISMISS_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // iOS install guidance (no beforeinstallprompt on Safari).
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || !isIos()) return;
    if (localStorage.getItem(IOS_DISMISS_KEY)) return;
    setIosHint(true);
  }, []);

  const dismissIos = () => {
    localStorage.setItem(IOS_DISMISS_KEY, "1");
    setIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // A deferred prompt can only be used once; drop it and close either way.
    if (outcome === "accepted") localStorage.setItem(DISMISS_KEY, "1");
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
          transition={spring.soft}
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          className="fixed left-1/2 z-40 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-card p-3 pl-4 shadow-lift"
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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}

      {iosHint && !visible && (
        <motion.div
          key="ios-hint"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={spring.soft}
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          className="fixed left-1/2 z-40 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-card p-3 pl-4 shadow-lift"
          role="dialog"
          aria-label="Add Daily OS to your Home Screen"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Share className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Add to Home Screen</p>
            <p className="flex flex-wrap items-center gap-1 text-[13px] text-ink-muted">
              Tap
              <Share className="inline h-3.5 w-3.5" aria-label="Share" />
              then
              <span className="inline-flex items-center gap-0.5 font-medium text-ink">
                <Plus className="h-3 w-3" /> Add to Home Screen
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={dismissIos}
            aria-label="Dismiss"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-fill/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
