"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTemplates } from "@/hooks/useTemplates";
import { CATEGORIES } from "@/lib/constants";
import type { TemplateItem } from "@/types";

/** Browse, create and delete task templates. Built-ins can't be removed. */
export function TemplateManager() {
  const { templates, create, remove } = useTemplates();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");
  const [lines, setLines] = useState("");

  const submit = async () => {
    const items: TemplateItem[] = lines
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((title) => ({
        title,
        category: CATEGORIES[0],
        priority: "medium",
        color: "burgundy",
      }));
    if (!name.trim() || items.length === 0) return;
    await create(name.trim(), icon.trim() || "✨", items);
    setName("");
    setIcon("✨");
    setLines("");
    setCreating(false);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {templates.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group flex items-center gap-1.5 rounded-full border border-line bg-card py-1.5 pl-3 pr-2 text-sm text-ink"
            >
              <span aria-hidden>{t.icon}</span>
              {t.name}
              <span className="text-xs text-ink-muted/70">+{t.items.length}</span>
              {!t.builtIn && (
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  aria-label={`Delete ${t.name}`}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-ink-muted/50 opacity-0 transition-opacity hover:text-alert group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      <AnimatePresence>
        {creating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-canvas/50 p-3">
              <div className="flex gap-2">
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  aria-label="Template icon"
                  className="w-14 text-center"
                  maxLength={2}
                />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Template name"
                  aria-label="Template name"
                />
              </div>
              <Textarea
                value={lines}
                onChange={(e) => setLines(e.target.value)}
                rows={4}
                placeholder={"One task per line…\nSolve 2 Leetcode\nRevise DBMS"}
                className="bg-card"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={submit}>
                  Create template
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
