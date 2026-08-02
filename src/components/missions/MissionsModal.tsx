"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Archive,
  ArchiveRestore,
  Check,
  MessageSquare,
  Plus,
  Rocket,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMissions } from "@/hooks/useMissions";
import { useIntelligence } from "@/hooks/useIntelligence";
import { toDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import { CATEGORIES, COLOR_MAP, DEFAULT_WORKSPACE_ID, TASK_COLORS } from "@/lib/constants";
import { CommentsThread } from "@/components/collab/CommentsThread";
import type { MissionPace, MissionProgress } from "@/engine";
import type { Mission, TaskColor } from "@/types";

interface MissionsModalProps {
  open: boolean;
  today: Date | null;
  onOpenChange: (open: boolean) => void;
}

const PACE_STYLE: Record<MissionPace, { label: string; className: string }> = {
  ahead: { label: "Ahead", className: "bg-success/12 text-success" },
  "on-track": { label: "On track", className: "bg-accent/10 text-accent" },
  behind: { label: "Behind", className: "bg-[#E5484D]/12 text-[#C13030]" },
  unknown: { label: "Open-ended", className: "bg-canvas text-ink-muted" },
};

const MISSION_ICONS = ["🎯", "🚀", "💼", "🏋️", "🎓", "🌍", "💡", "🏆", "📚", "🧠"];

/**
 * Mission Mode — Daily OS's long-term execution surface. Create missions with
 * milestones, link tasks to them (from the composer), and watch live progress
 * and pace derived by the Intelligence Engine.
 */
export function MissionsModal({ open, today, onOpenChange }: MissionsModalProps) {
  const { missions, loading } = useMissions();
  const report = useIntelligence(open ? today : null);

  const progressById = useMemo(() => {
    const map = new Map<string, MissionProgress>();
    for (const p of report?.missions ?? []) map.set(p.missionId, p);
    return map;
  }, [report]);

  const [creating, setCreating] = useState(false);

  const active = missions.filter((m) => !m.archived);
  const archived = missions.filter((m) => m.archived);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Missions"
      description="Long-term execution"
      variant="sheet"
      className="max-w-3xl"
    >
      <div className="flex max-h-[94dvh] flex-col sm:max-h-[calc(100dvh-3rem)]">
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-9 sm:px-10 sm:pt-10">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
              <Rocket className="h-3.5 w-3.5" /> Mission Mode
            </p>
            <h2 className="mt-1 font-display text-3xl font-light tracking-tight text-ink sm:text-4xl">
              Your missions
            </h2>
          </div>
          <Button
            variant={creating ? "secondary" : "primary"}
            size="sm"
            className="mr-10 mt-1"
            onClick={() => setCreating((v) => !v)}
          >
            {creating ? "Close" : (<><Plus className="h-4 w-4" /> New</>)}
          </Button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-10">
          {creating && today && (
            <CreateMission
              todayKey={toDateKey(today)}
              onCreated={() => setCreating(false)}
            />
          )}

          {!loading && active.length === 0 && !creating && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line py-14 text-center">
              <Target className="h-8 w-8 text-ink-muted/50" />
              <div>
                <p className="font-display text-xl font-light text-ink">
                  No missions yet.
                </p>
                <p className="mt-1 text-[13px] text-ink-muted">
                  Turn a big goal — placements, a startup, fitness — into daily work.
                </p>
              </div>
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Create your first mission
              </Button>
            </div>
          )}

          {active.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              progress={progressById.get(mission.id) ?? null}
            />
          ))}

          {archived.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted/70">
                Archived
              </p>
              {archived.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  progress={progressById.get(mission.id) ?? null}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function CreateMission({
  todayKey,
  onCreated,
}: {
  todayKey: string;
  onCreated: () => void;
}) {
  const { create } = useMissions();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [color, setColor] = useState<TaskColor>("burgundy");
  const [icon, setIcon] = useState(MISSION_ICONS[0]);
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    await create({
      title,
      description,
      category,
      color,
      icon,
      startDate: todayKey,
      targetDate: targetDate || null,
    });
    setSaving(false);
    onCreated();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/50 p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="mission-title">Mission</Label>
        <Input
          id="mission-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Crack Placements"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-1.5">
          {MISSION_ICONS.map((glyph) => (
            <button
              key={glyph}
              type="button"
              onClick={() => setIcon(glyph)}
              aria-pressed={icon === glyph}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors",
                icon === glyph
                  ? "border-accent bg-accent/10"
                  : "border-line hover:border-ink/20",
              )}
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="mission-category">Category</Label>
          <Select
            id="mission-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="mission-target">Target date</Label>
          <input
            id="mission-target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="h-9 rounded-lg border border-line bg-card px-2 text-sm text-ink focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {TASK_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setColor(c.key)}
              aria-label={c.label}
              aria-pressed={color === c.key}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
              style={color === c.key ? { boxShadow: `0 0 0 2px ${c.dot}` } : undefined}
            >
              <span className="h-5 w-5 rounded-full" style={{ backgroundColor: c.dot }} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="mission-desc">Why it matters</Label>
        <Textarea
          id="mission-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — the outcome you're aiming for."
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCreated}>
          Cancel
        </Button>
        <Button size="sm" disabled={!title.trim() || saving} onClick={submit}>
          Create mission
        </Button>
      </div>
    </motion.div>
  );
}

function MissionCard({
  mission,
  progress,
}: {
  mission: Mission;
  progress: MissionProgress | null;
}) {
  const { update, remove, addMilestone, toggleMilestone, removeMilestone, setArchived } =
    useMissions();
  const swatch = COLOR_MAP[mission.color];
  const overall = progress ? Math.round(progress.overall * 100) : 0;
  const pace = PACE_STYLE[progress?.pace ?? "unknown"];
  const [milestoneTitle, setMilestoneTitle] = useState("");

  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card p-4 shadow-soft sm:p-5",
        mission.archived && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ backgroundColor: swatch.soft }}
        >
          {mission.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-lg font-normal text-ink">
              {mission.title}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                pace.className,
              )}
            >
              {pace.label}
            </span>
          </div>
          {mission.description && (
            <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-muted">
              {mission.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={mission.archived ? "Unarchive" : "Archive"}
            onClick={() => setArchived(mission.id, !mission.archived)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted/60 transition-colors hover:bg-black/[0.05] hover:text-ink"
          >
            {mission.archived ? (
              <ArchiveRestore className="h-4 w-4" />
            ) : (
              <Archive className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            aria-label="Delete mission"
            onClick={() => remove(mission.id)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted/60 transition-colors hover:bg-accent/10 hover:text-accent"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[12px] text-ink-muted">
          <span>{overall}% complete</span>
          {progress?.daysTotal != null && (
            <span>
              Day {progress.daysElapsed} of {progress.daysTotal}
            </span>
          )}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${overall}%`, backgroundColor: swatch.dot }}
          />
        </div>
        {progress && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-muted">
            <span>
              {mission.milestones.filter((m) => m.done).length}/
              {mission.milestones.length} milestones
            </span>
            <span>
              {progress.completedTaskCount} of{" "}
              {progress.completedTaskCount + progress.activeTaskCount} tasks done
            </span>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="mt-4 flex flex-col gap-1.5">
        {mission.milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleMilestone(mission.id, m.id)}
              aria-pressed={m.done}
              aria-label={m.done ? "Mark milestone undone" : "Mark milestone done"}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                m.done
                  ? "border-success bg-success text-white"
                  : "border-line text-transparent hover:border-accent",
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </button>
            <span
              className={cn(
                "flex-1 text-[13px]",
                m.done ? "text-ink-muted line-through" : "text-ink",
              )}
            >
              {m.title}
            </span>
            <button
              type="button"
              aria-label="Remove milestone"
              onClick={() => removeMilestone(mission.id, m.id)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted/40 transition-colors hover:text-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!milestoneTitle.trim()) return;
            void addMilestone(mission.id, milestoneTitle);
            setMilestoneTitle("");
          }}
          className="mt-1 flex items-center gap-2"
        >
          <input
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            placeholder="Add a milestone…"
            className="h-8 flex-1 rounded-lg border border-line bg-canvas px-2.5 text-[13px] text-ink focus:border-accent/50 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Add milestone"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      <MissionDiscussion mission={mission} />

      {mission.archived && (
        <button
          type="button"
          onClick={() => update(mission.id, { archived: false })}
          className="mt-3 text-[12px] font-medium text-accent"
        >
          Reactivate mission
        </button>
      )}
    </div>
  );
}

/** Collapsible per-mission discussion (Module 6). Additive; closed by default. */
function MissionDiscussion({ mission }: { mission: Mission }) {
  const [open, setOpen] = useState(false);
  const workspaceId = mission.workspaceId ?? DEFAULT_WORKSPACE_ID;
  return (
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-accent"
      >
        <MessageSquare className="h-3.5 w-3.5" /> {open ? "Hide discussion" : "Discussion"}
      </button>
      {open && (
        <div className="mt-3">
          <CommentsThread
            workspaceId={workspaceId}
            targetType="mission"
            targetId={mission.id}
            compact
          />
        </div>
      )}
    </div>
  );
}
