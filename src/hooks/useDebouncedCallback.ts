"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a stable debounced version of `callback`. Pending calls flush on
 * unmount so in-flight autosaves (e.g. notes) are never lost.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(callback);
  const lastArgs = useRef<Args | null>(null);

  useEffect(() => {
    latest.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        if (lastArgs.current) latest.current(...lastArgs.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      lastArgs.current = args;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        lastArgs.current = null;
        latest.current(...args);
      }, delay);
    },
    [delay],
  );
}
