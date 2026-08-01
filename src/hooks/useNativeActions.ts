"use client";

import { useEffect, useRef } from "react";
import { onNativeAction, type NativeAction } from "@/lib/native/native";

export interface NativeActionHandlers {
  onOpen?: () => void;
  onDashboard?: () => void;
  onQuickAdd?: () => void;
  onFocus?: () => void;
}

/**
 * Subscribe to native shell actions (system tray + global shortcuts) and route
 * them to app handlers. A no-op in the browser. Handlers are held in a ref so
 * the subscription is created exactly once and never churns.
 */
export function useNativeActions(handlers: NativeActionHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    let unlisten = () => {};
    let active = true;
    void onNativeAction((action: NativeAction) => {
      const h = ref.current;
      if (action === "open") h.onOpen?.();
      else if (action === "dashboard") h.onDashboard?.();
      else if (action === "quick-add") h.onQuickAdd?.();
      else if (action === "focus") h.onFocus?.();
    }).then((u) => {
      // If the component unmounted before the listener registered, drop it.
      if (active) unlisten = u;
      else u();
    });
    return () => {
      active = false;
      unlisten();
    };
  }, []);
}
