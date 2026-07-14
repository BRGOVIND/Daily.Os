"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getHours } from "date-fns";
import { REVIEW_HOUR } from "@/lib/constants";
import { showNotification } from "@/lib/notifications";

/**
 * Decides when the daily review should surface: at/after REVIEW_HOUR local
 * time, once per day, unless already completed or dismissed this session.
 * Re-checks each minute so it appears even if the app is left open.
 */
export function useDailyReview(
  today: Date | null,
  reviewCompleted: boolean,
  enabled: boolean,
): { due: boolean; dismiss: () => void } {
  const [due, setDue] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const notifiedRef = useRef(false);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setDue(false);
  }, []);

  useEffect(() => {
    if (!enabled || !today || reviewCompleted || dismissed) {
      setDue(false);
      return;
    }

    const check = () => {
      const isDue = getHours(new Date()) >= REVIEW_HOUR;
      setDue(isDue);
      if (isDue && !notifiedRef.current) {
        notifiedRef.current = true;
        showNotification(
          "Daily review · Daily OS",
          "Take a calm moment to reflect on your day.",
        );
      }
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [enabled, today, reviewCompleted, dismissed]);

  return { due, dismiss };
}
