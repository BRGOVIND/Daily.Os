"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { APP_NAME } from "@/lib/constants";
import { quoteForDate } from "@/lib/quotes";
import { BrandMark } from "@/components/ui/BrandMark";
import type { Profile } from "@/lib/profiles";

interface HeroProps {
  profile: Profile;
  isGuest: boolean;
  autoAdvance: boolean;
  onStart: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** The calm entry screen: greeting, date, a daily quote and one clear action. */
export function Hero({ profile, isGuest, autoAdvance, onStart }: HeroProps) {
  const reduce = useReducedMotion();
  const now = new Date();
  const quote = quoteForDate(now);
  const name = isGuest ? "" : profile.name.split(/\s+/)[0];

  useEffect(() => {
    if (!autoAdvance) return;
    const t = setTimeout(onStart, 2800);
    return () => clearTimeout(t);
  }, [autoAdvance, onStart]);

  const container = {
    animate: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
  };
  const item = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-6 text-center">
      {/* soft ambient glow */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-warning/10 blur-3xl"
            animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
        </>
      )}

      <motion.div
        variants={container}
        initial="initial"
        animate="animate"
        className="relative z-10 flex max-w-lg flex-col items-center"
      >
        <motion.div variants={item} className="mb-8 flex items-center gap-2.5">
          <BrandMark size={32} decorative />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            {APP_NAME}
          </span>
        </motion.div>

        <motion.p
          variants={item}
          className="text-[13px] font-medium uppercase tracking-[0.16em] text-accent"
        >
          {format(now, "EEEE, MMMM d")}
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-3 font-display text-4xl font-light leading-[1.1] tracking-[-0.02em] text-ink sm:text-6xl"
        >
          {greeting(now)}
          {name ? (
            <>
              ,<br />
              <span className="text-accent">{name}.</span>
            </>
          ) : (
            "."
          )}
        </motion.h1>

        <motion.figure
          variants={item}
          className="mt-8 max-w-md border-l-2 border-accent/30 pl-4 text-left"
        >
          <p className="font-display text-lg font-light italic leading-relaxed text-ink">
            &ldquo;{quote.text}&rdquo;
          </p>
          <figcaption className="mt-1.5 text-sm text-ink-muted">
            — {quote.author}
          </figcaption>
        </motion.figure>

        <motion.button
          variants={item}
          type="button"
          onClick={onStart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-10 flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-white shadow-glow transition-colors hover:bg-accent-hover"
        >
          Start today <ArrowRight className="h-4 w-4" />
        </motion.button>

        {isGuest && (
          <motion.p variants={item} className="mt-4 text-[13px] text-ink-muted">
            You&rsquo;re in <span className="font-medium text-ink">Guest mode</span> — data is temporary.
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
