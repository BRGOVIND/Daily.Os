"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { BrandMark } from "@/components/ui/BrandMark";

interface OnboardingProps {
  onCreate: (name: string) => void;
  onGuest: () => void;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** First-run welcome: create a local profile, or continue as Guest. */
export function Onboarding({ onCreate, onGuest }: OnboardingProps) {
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <BrandMark size={32} decorative />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            {APP_NAME}
          </span>
        </div>

        <h1 className="font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
          What should we call you?
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-ink-muted">
          Daily OS keeps everything on this device. No account, no sign-up — just
          a name for your workspace.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto mt-8 flex max-w-sm flex-col gap-3"
        >
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            aria-label="Your name"
            maxLength={40}
            className="h-12 text-center text-base"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-medium text-white shadow-soft transition-all hover:bg-accent-hover hover:shadow-glow disabled:pointer-events-none disabled:opacity-40 active:scale-[0.99]"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <button
          type="button"
          onClick={onGuest}
          className="mt-6 text-[13px] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Continue as Guest
        </button>
      </motion.div>
    </div>
  );
}
