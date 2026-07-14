"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Github,
  Heart,
  Leaf,
  Lock,
  Repeat,
  Sparkles,
  Target,
  WifiOff,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { BrandMark } from "@/components/ui/BrandMark";

/** Update to the public repository URL before release. */
const REPO_URL = "https://github.com";

const EASE = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  { icon: CalendarDays, title: "Calendar-native", body: "Open a date, not a to-do list. Every day has its own calm workspace." },
  { icon: Target, title: "Today's Focus", body: "Set your intentions as elegant cards and let the noise fall away." },
  { icon: Repeat, title: "Habits & recurring", body: "Build streaks and let recurring work appear on the right days." },
  { icon: Leaf, title: "A growing journey", body: "Your consistency grows a living tree — a journal, not a dashboard." },
  { icon: WifiOff, title: "Offline-first", body: "Everything works with no connection. Nothing waits on a server." },
  { icon: Lock, title: "Private by design", body: "Your data lives only in your browser. No account, no tracking." },
];

const STEPS = [
  { n: "01", title: "Open a day", body: "The calendar is home. Tap any date to open its full workspace." },
  { n: "02", title: "Plan with intention", body: "Add focus, tasks and habits. Complete them with a satisfying tap." },
  { n: "03", title: "Reflect & grow", body: "A nightly review, a growing tree, and streaks that keep you coming back." },
];

export default function WelcomePage() {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <BrandMark size={28} decorative />
            <span className="text-[15px] font-semibold tracking-tight">{APP_NAME}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-ink-muted transition-colors hover:bg-black/[0.04] hover:text-ink"
            >
              <Github className="h-4 w-4" /> GitHub
            </a>
            <Link
              href="/"
              className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-white shadow-soft transition-all hover:bg-accent-hover hover:shadow-glow active:scale-[0.98]"
            >
              Launch app <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-5 pb-16 pt-20 text-center sm:px-8 sm:pt-28">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-[13px] text-ink-muted"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" /> A Daily Operating System
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
          className="font-display text-5xl font-light leading-[1.05] tracking-[-0.02em] text-ink sm:text-7xl"
        >
          Your day,
          <br />
          <span className="text-accent">beautifully organized.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-muted"
        >
          Not another to-do app. A calm, offline-first workspace where every day
          has its own home — and consistency grows something beautiful.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
          className="mt-9 flex items-center justify-center gap-3"
        >
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-glow transition-all hover:bg-accent-hover active:scale-[0.98]"
          >
            Launch app <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-ink/20"
          >
            <Github className="h-4 w-4" /> Star on GitHub
          </a>
        </motion.div>

        {/* Illustrative app preview */}
        <Reveal delay={0.35} className="mt-16">
          <AppPreview />
        </Reveal>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <Reveal className="mb-10 text-center">
          <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
            Everything you need. Nothing you don&rsquo;t.
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="h-full rounded-3xl border border-line bg-card p-6 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[17px] font-semibold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <Reveal className="mb-10 text-center">
          <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
            How it works
          </h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="flex flex-col gap-2">
                <span className="font-display text-5xl font-light text-accent/30">{s.n}</span>
                <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Values band */}
      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: WifiOff, title: "Offline first", body: "Install it, then use it anywhere — planes, tunnels, dead zones. It just works." },
            { icon: Lock, title: "Privacy first", body: "No sign-up. No servers. No analytics. Your day is yours, stored on your device." },
            { icon: Heart, title: "Open source", body: "Free and MIT-licensed. Read the code, self-host, or make it your own." },
          ].map((v, i) => (
            <Reveal key={v.title} delay={i * 0.06}>
              <div className="flex h-full flex-col gap-3 rounded-3xl border border-line bg-card p-7 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <v.icon className="h-5 w-5" />
                </span>
                <h3 className="text-[17px] font-semibold">{v.title}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
        <Reveal>
          <h2 className="font-display text-4xl font-light tracking-tight sm:text-5xl">
            Begin your journey today.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-ink-muted">
            One quiet workspace, one growing tree, one day at a time.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-white shadow-glow transition-all hover:bg-accent-hover active:scale-[0.98]"
            >
              Launch {APP_NAME} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-ink-muted sm:flex-row sm:px-8">
          <span>
            {APP_NAME} · Offline-first · MIT licensed
          </span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition-colors hover:text-ink"
          >
            <Github className="h-4 w-4" /> Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

/** A tasteful, code-drawn preview of the app (no screenshots needed). */
function AppPreview() {
  return (
    <div className="mx-auto max-w-3xl rounded-[28px] border border-line bg-card p-4 shadow-lift sm:p-6">
      <div className="flex items-center gap-1.5 pb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-line" />
      </div>
      <div className="text-left">
        <p className="font-display text-2xl font-light tracking-tight sm:text-3xl">
          July <span className="text-ink-muted/60">2026</span>
        </p>
        <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }).map((_, i) => {
            const inMonth = i >= 2 && i < 33;
            const done = [8, 9, 15, 16, 22].includes(i);
            const partial = [10, 17, 23, 24].includes(i);
            const today = i === 18;
            return (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-xl border text-[11px] sm:text-xs ${
                  inMonth ? "border-line bg-card" : "border-transparent"
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    today
                      ? "bg-accent font-semibold text-white shadow-glow"
                      : done
                        ? "bg-success/15 text-success"
                        : partial
                          ? "bg-warning/20 text-warning"
                          : inMonth
                            ? "text-ink"
                            : "text-transparent"
                  }`}
                >
                  {inMonth ? i - 1 : ""}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
