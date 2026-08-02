"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TASK_COLORS, WORKSPACE_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { TaskColor, Workspace } from "@/types";
import type { WorkspaceInput } from "@/lib/db";

interface CreateWorkspaceProps {
  /** When editing, the workspace to prefill. Omit to create. */
  initial?: Workspace;
  onSubmit: (input: WorkspaceInput) => Promise<void> | void;
  onCancel: () => void;
}

/** Shared create/edit form for a workspace. */
export function CreateWorkspace({ initial, onSubmit, onCancel }: CreateWorkspaceProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? WORKSPACE_ICONS[0]);
  const [color, setColor] = useState<TaskColor>(initial?.color ?? "burgundy");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    await onSubmit({ name, icon, color, description });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/50 p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input
          id="ws-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Placement Prep"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-1.5">
          {WORKSPACE_ICONS.map((glyph) => (
            <button
              key={glyph}
              type="button"
              onClick={() => setIcon(glyph)}
              aria-pressed={icon === glyph}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors",
                icon === glyph ? "border-accent bg-accent/10" : "border-line hover:border-ink/20",
              )}
            >
              {glyph}
            </button>
          ))}
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
        <Label htmlFor="ws-desc">Description</Label>
        <Textarea
          id="ws-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional — what this space is for."
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-[13px] text-ink-muted hover:text-ink">
          Cancel
        </button>
        <button
          type="button"
          disabled={!name.trim() || saving}
          onClick={submit}
          className="rounded-full bg-accent px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {initial ? "Save changes" : "Create workspace"}
        </button>
      </div>
    </motion.div>
  );
}
