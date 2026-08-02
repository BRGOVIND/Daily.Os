"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  ShoppingCart,
  Wallet,
  Timer,
  Music,
  Trophy,
  Users,
  Globe,
  Watch,
  Plus,
  Minus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Flag,
} from "lucide-react";
import { useUtility } from "@/hooks/useUtility";
import { showNotification } from "@/lib/notifications";
import { COUNTDOWN_PRESETS } from "@/lib/constants";
import { createId } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** A short synthesized beep — no assets, works fully offline. */
function beep(times = 1) {
  if (typeof window === "undefined") return;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  let t = ctx.currentTime;
  for (let i = 0; i < times; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
    t += 0.28;
  }
  window.setTimeout(() => void ctx.close(), times * 300 + 300);
}

function fieldClass(extra?: string) {
  return cn(
    "rounded-xl bg-fill/[0.04] px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted/70 focus:ring-2 focus:ring-accent/30",
    extra,
  );
}

// ─── Shopping List ────────────────────────────────────────────────────────────

interface ShopItem {
  id: string;
  text: string;
  done: boolean;
}

function ShoppingListTool() {
  const { data, save } = useUtility<ShopItem[]>("shopping", []);
  const [text, setText] = useState("");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    save([...data, { id: createId(), text: t, done: false }]);
    setText("");
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add item…"
          className={fieldClass("flex-1")}
        />
        <button
          type="button"
          onClick={add}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white"
          aria-label="Add"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-3 space-y-1">
        {data.map((it) => (
          <li key={it.id} className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                save(data.map((d) => (d.id === it.id ? { ...d, done: !d.done } : d)))
              }
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border-2 text-white transition-colors",
                it.done ? "border-accent bg-accent" : "border-fill/20",
              )}
            >
              {it.done && "✓"}
            </button>
            <span className={cn("flex-1 text-sm", it.done ? "text-ink-muted line-through" : "text-ink")}>
              {it.text}
            </span>
            <button
              type="button"
              onClick={() => save(data.filter((d) => d.id !== it.id))}
              className="text-ink-muted hover:text-ink"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {data.length === 0 && (
          <li className="py-6 text-center text-sm text-ink-muted">Your list is empty.</li>
        )}
      </ul>
      {data.some((d) => d.done) && (
        <button
          type="button"
          onClick={() => save(data.filter((d) => !d.done))}
          className="mt-3 text-xs text-ink-muted underline-offset-2 hover:underline"
        >
          Clear checked
        </button>
      )}
    </div>
  );
}

// ─── Expense Notes ────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  label: string;
  amount: number;
}

function ExpenseNotesTool() {
  const { data, save } = useUtility<Expense[]>("expenses", []);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const add = () => {
    const a = parseFloat(amount);
    if (!label.trim() || Number.isNaN(a)) return;
    save([...data, { id: createId(), label: label.trim(), amount: a }]);
    setLabel("");
    setAmount("");
  };

  const total = data.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What for?"
          className={fieldClass("flex-1")}
        />
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          inputMode="decimal"
          placeholder="0.00"
          className={fieldClass("w-20 text-right")}
        />
        <button
          type="button"
          onClick={add}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white"
          aria-label="Add"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-3 space-y-1">
        {data.map((e) => (
          <li key={e.id} className="flex items-center gap-2 text-sm">
            <span className="flex-1 text-ink">{e.label}</span>
            <span className="tabular-nums text-ink">{e.amount.toFixed(2)}</span>
            <button
              type="button"
              onClick={() => save(data.filter((x) => x.id !== e.id))}
              className="text-ink-muted hover:text-ink"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-fill/5 pt-3 text-sm font-semibold text-ink">
        <span>Total</span>
        <span className="tabular-nums">{total.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function CountdownTool() {
  const [total, setTotal] = useState(5 * 60);
  const [left, setLeft] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const endRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) {
        setRunning(false);
        beep(3);
        showNotification("Countdown finished · Daily OS", "Time's up.");
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const setPreset = (mins: number) => {
    setRunning(false);
    setTotal(mins * 60);
    setLeft(mins * 60);
  };
  const startPause = () => {
    if (running) {
      setRunning(false);
    } else {
      if (left <= 0) setLeft(total);
      endRef.current = Date.now() + (left <= 0 ? total : left) * 1000;
      setRunning(true);
    }
  };
  const reset = () => {
    setRunning(false);
    setLeft(total);
  };

  const mm = Math.floor(left / 60).toString().padStart(2, "0");
  const ss = (left % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-5xl font-semibold tabular-nums text-ink">
        {mm}:{ss}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {COUNTDOWN_PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPreset(m)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              total === m * 60 ? "bg-accent text-white" : "bg-fill/[0.05] text-ink-muted hover:text-ink",
            )}
          >
            {m}m
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-fill/[0.05]"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={startPause}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-glow"
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
        </button>
      </div>
    </div>
  );
}

// ─── Metronome ────────────────────────────────────────────────────────────────

function MetronomeTool() {
  const [bpm, setBpm] = useState(100);
  const [running, setRunning] = useState(false);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    if (!running) return;
    const interval = 60000 / bpm;
    beep(1);
    const id = window.setInterval(() => beep(1), interval);
    return () => window.clearInterval(id);
    // Restart the interval when bpm changes while running.
  }, [running, bpm]);

  const tap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= 2) {
      const gaps: number[] = [];
      for (let i = 1; i < taps.current.length; i++) {
        gaps.push(taps.current[i] - taps.current[i - 1]);
      }
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.min(240, Math.max(40, Math.round(60000 / avg))));
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl font-semibold tabular-nums text-ink">{bpm}</div>
      <div className="text-xs uppercase tracking-wide text-ink-muted">BPM</div>
      <input
        type="range"
        min={40}
        max={240}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="mt-4 w-full accent-[var(--accent-color,#8C1232)]"
        style={{ accentColor: "rgb(var(--accent))" }}
      />
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={tap}
          className="rounded-full bg-fill/[0.05] px-4 py-2.5 text-sm font-medium text-ink hover:bg-fill/[0.08]"
        >
          Tap tempo
        </button>
        <button
          type="button"
          onClick={() => setRunning((v) => !v)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-glow"
          aria-label={running ? "Stop" : "Start"}
        >
          {running ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
        </button>
      </div>
    </div>
  );
}

// ─── Score Counter ────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  score: number;
}

function ScoreCounterTool() {
  const { data, save } = useUtility<Player[]>("score", []);
  const [name, setName] = useState("");

  const players =
    data.length > 0 ? data : [{ id: "p1", name: "Player 1", score: 0 }];

  const bump = (id: string, delta: number) =>
    save(players.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p)));

  return (
    <div>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id} className="flex items-center gap-2 rounded-xl bg-fill/[0.03] px-3 py-2">
            <span className="flex-1 truncate text-sm font-medium text-ink">{p.name}</span>
            <button
              type="button"
              onClick={() => bump(p.id, -1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-ink shadow-sm"
              aria-label="Minus"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-semibold tabular-nums text-ink">
              {p.score}
            </span>
            <button
              type="button"
              onClick={() => bump(p.id, 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white"
              aria-label="Plus"
            >
              <Plus className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              save([...players, { id: createId(), name: name.trim(), score: 0 }]);
              setName("");
            }
          }}
          placeholder="Add player…"
          className={fieldClass("flex-1")}
        />
        <button
          type="button"
          onClick={() => save(players.map((p) => ({ ...p, score: 0 })))}
          className="rounded-xl bg-fill/[0.05] px-3 text-sm text-ink hover:bg-fill/[0.08]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Bill Split ───────────────────────────────────────────────────────────────

function BillSplitTool() {
  const [bill, setBill] = useState("");
  const [people, setPeople] = useState(2);
  const [tip, setTip] = useState(10);

  const amount = parseFloat(bill) || 0;
  const withTip = amount * (1 + tip / 100);
  const per = people > 0 ? withTip / people : 0;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-muted">Bill amount</span>
        <input
          value={bill}
          onChange={(e) => setBill(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          className={fieldClass("w-full")}
        />
      </label>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink">People</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPeople((p) => Math.max(1, p - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-fill/[0.05]"
            aria-label="Fewer"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-semibold tabular-nums text-ink">{people}</span>
          <button
            type="button"
            onClick={() => setPeople((p) => p + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-fill/[0.05]"
            aria-label="More"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between text-sm text-ink">
          <span>Tip</span>
          <span className="tabular-nums text-ink-muted">{tip}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={30}
          value={tip}
          onChange={(e) => setTip(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: "rgb(var(--accent))" }}
        />
      </div>
      <div className="rounded-2xl bg-accent/[0.06] p-4 text-center">
        <div className="text-3xl font-bold tabular-nums text-accent">{per.toFixed(2)}</div>
        <div className="mt-0.5 text-xs text-ink-muted">
          per person · {withTip.toFixed(2)} total
        </div>
      </div>
    </div>
  );
}

// ─── Time Converter ───────────────────────────────────────────────────────────

const ZONES = [
  { label: "UTC", tz: "UTC" },
  { label: "New York", tz: "America/New_York" },
  { label: "London", tz: "Europe/London" },
  { label: "India", tz: "Asia/Kolkata" },
  { label: "Tokyo", tz: "Asia/Tokyo" },
  { label: "Sydney", tz: "Australia/Sydney" },
];

function TimeConverterTool() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  });

  const base = useMemo(() => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    if (!Number.isNaN(h) && !Number.isNaN(m)) d.setHours(h, m, 0, 0);
    return d;
  }, [time]);

  return (
    <div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-muted">
          Local time
        </span>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={fieldClass("w-full")}
        />
      </label>
      <ul className="mt-3 divide-y divide-fill/[0.05]">
        {ZONES.map((z) => {
          let formatted = "—";
          try {
            formatted = new Intl.DateTimeFormat(undefined, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: z.tz,
            }).format(base);
          } catch {
            /* zone unsupported — leave dash */
          }
          return (
            <li key={z.tz} className="flex items-center justify-between py-2 text-sm">
              <span className="text-ink-muted">{z.label}</span>
              <span className="font-medium tabular-nums text-ink">{formatted}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Stopwatch ────────────────────────────────────────────────────────────────

function StopwatchTool() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startRef = useRef(0);
  const accRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    const id = window.setInterval(() => {
      setElapsed(accRef.current + (Date.now() - startRef.current));
    }, 50);
    return () => window.clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) {
      accRef.current += Date.now() - startRef.current;
      setRunning(false);
    } else {
      setRunning(true);
    }
  };
  const reset = () => {
    setRunning(false);
    accRef.current = 0;
    setElapsed(0);
    setLaps([]);
  };
  const lap = () => setLaps((l) => [elapsed, ...l]);

  const fmt = (ms: number) => {
    const cs = Math.floor((ms % 1000) / 10);
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 60000);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="font-mono text-4xl font-semibold tabular-nums text-ink">
        {fmt(elapsed)}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={running ? lap : reset}
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-fill/[0.05]"
          aria-label={running ? "Lap" : "Reset"}
        >
          {running ? <Flag className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={toggle}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-glow"
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
        </button>
      </div>
      {laps.length > 0 && (
        <ul className="mt-4 max-h-32 w-full space-y-1 overflow-y-auto">
          {laps.map((l, i) => (
            <li key={i} className="flex justify-between text-sm text-ink-muted">
              <span>Lap {laps.length - i}</span>
              <span className="tabular-nums">{fmt(l)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export interface UtilityTool {
  id: string;
  name: string;
  hint: string;
  Icon: ComponentType<{ className?: string }>;
  Component: ComponentType;
}

export const UTILITY_TOOLS: UtilityTool[] = [
  { id: "shopping", name: "Shopping List", hint: "Quick checklist", Icon: ShoppingCart, Component: ShoppingListTool },
  { id: "expenses", name: "Expense Notes", hint: "Jot spending", Icon: Wallet, Component: ExpenseNotesTool },
  { id: "countdown", name: "Countdown", hint: "Set a timer", Icon: Timer, Component: CountdownTool },
  { id: "metronome", name: "Metronome", hint: "Keep tempo", Icon: Music, Component: MetronomeTool },
  { id: "score", name: "Score Counter", hint: "Track points", Icon: Trophy, Component: ScoreCounterTool },
  { id: "billsplit", name: "Bill Split", hint: "Divide a bill", Icon: Users, Component: BillSplitTool },
  { id: "converter", name: "Time Converter", hint: "Across zones", Icon: Globe, Component: TimeConverterTool },
  { id: "stopwatch", name: "Stopwatch", hint: "Lap timing", Icon: Watch, Component: StopwatchTool },
];
