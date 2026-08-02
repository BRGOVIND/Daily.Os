"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Library, Pin, Plus, Star, Trash2 } from "lucide-react";
import { useResources } from "@/hooks/useResources";
import {
  allTags,
  filterResources,
  parseTags,
  EMPTY_RESOURCE_FILTER,
  type ResourceFilter,
} from "@/workspace";
import { CATEGORIES, RESOURCE_KINDS, RESOURCE_KIND_MAP } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "./EmptyState";
import type { Resource, ResourceKind } from "@/types";

interface ResourcesTabProps {
  workspaceId: string;
}

/** Module 3 — the workspace resource library: searchable, taggable, pinnable. */
export function ResourcesTab({ workspaceId }: ResourcesTabProps) {
  const { resources, create, remove, togglePinned, toggleFavorite } = useResources(workspaceId);
  const [filter, setFilter] = useState<ResourceFilter>(EMPTY_RESOURCE_FILTER);
  const [adding, setAdding] = useState(false);

  const tags = useMemo(() => allTags(resources), [resources]);
  const shown = useMemo(() => filterResources(resources, filter), [resources, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[160px] flex-1">
          <Input
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            placeholder="Search resources…"
            className="h-9 text-[14px]"
          />
        </div>
        <Select
          value={filter.kind}
          onChange={(e) => setFilter((f) => ({ ...f, kind: e.target.value as ResourceKind | "all" }))}
          className="h-9 w-auto text-[14px]"
          options={[
            { value: "all", label: "All kinds" },
            ...RESOURCE_KINDS.map((r) => ({ value: r.kind, label: r.label })),
          ]}
        />
        <button
          type="button"
          onClick={() => setFilter((f) => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
          aria-pressed={filter.favoritesOnly}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] transition-colors",
            filter.favoritesOnly
              ? "border-accent bg-accent/10 text-accent"
              : "border-line text-ink-muted hover:border-ink/20",
          )}
        >
          <Star className="h-3.5 w-3.5" fill={filter.favoritesOnly ? "currentColor" : "none"} /> Favorites
        </button>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setFilter((f) => ({ ...f, tag: f.tag === tag ? null : tag }))}
              className={cn(
                "rounded-full px-2.5 py-1 text-[12px] transition-colors",
                filter.tag === tag
                  ? "bg-accent text-white"
                  : "bg-canvas text-ink-muted hover:text-ink",
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {adding && (
        <AddResource
          workspaceId={workspaceId}
          onCreate={create}
          onDone={() => setAdding(false)}
        />
      )}

      {shown.length === 0 ? (
        !adding && (
          <EmptyState
            icon={<Library className="h-8 w-8" />}
            title={resources.length === 0 ? "No resources yet." : "No matches."}
            hint="Save links, articles, videos, repositories, PDFs and books — tagged and searchable."
            actionLabel={resources.length === 0 ? "Add a resource" : undefined}
            onAction={resources.length === 0 ? () => setAdding(true) : undefined}
          />
        )
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {shown.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onTogglePinned={() => togglePinned(r.id, !r.pinned)}
              onToggleFavorite={() => toggleFavorite(r.id, !r.favorite)}
              onDelete={() => remove(r.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function AddResource({
  workspaceId,
  onCreate,
  onDone,
}: {
  workspaceId: string;
  onCreate: ReturnType<typeof useResources>["create"];
  onDone: () => void;
}) {
  const [kind, setKind] = useState<ResourceKind>("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    await onCreate({
      workspaceId,
      kind,
      title,
      url,
      description: "",
      tags: parseTags(tags),
      category,
    });
    setSaving(false);
    onDone();
  };

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-canvas/50 p-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Select
          value={kind}
          onChange={(e) => setKind(e.target.value as ResourceKind)}
          className="h-9 text-[14px]"
          options={RESOURCE_KINDS.map((r) => ({ value: r.kind, label: `${r.icon} ${r.label}` }))}
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 text-[14px]"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-9 text-[14px]" autoFocus />
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL or reference" className="h-9 text-[14px]" />
      <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, comma separated" className="h-9 text-[14px]" />
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-full px-3 py-1.5 text-[13px] text-ink-muted hover:text-ink">
          Cancel
        </button>
        <button
          type="button"
          disabled={!title.trim() || saving}
          onClick={submit}
          className="rounded-full bg-accent px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          Save resource
        </button>
      </div>
    </div>
  );
}

function ResourceCard({
  resource,
  onTogglePinned,
  onToggleFavorite,
  onDelete,
}: {
  resource: Resource;
  onTogglePinned: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const meta = RESOURCE_KIND_MAP[resource.kind];
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-line bg-card p-3.5">
      <div className="flex items-start gap-2">
        <span className="text-lg">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{resource.title}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink-muted/70">
            {meta.label} · {resource.category}
          </p>
        </div>
        {resource.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-accent" fill="currentColor" />}
      </div>

      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {resource.tags.map((t) => (
            <span key={t} className="rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink-muted">
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex items-center gap-1">
        {resource.url && (
          <a
            href={/^https?:\/\//.test(resource.url) ? resource.url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] transition-colors",
              /^https?:\/\//.test(resource.url)
                ? "text-accent hover:bg-accent/10"
                : "pointer-events-none text-ink-muted/60",
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
        )}
        <div className="flex-1" />
        <button
          type="button"
          aria-label={resource.favorite ? "Unfavorite" : "Favorite"}
          onClick={onToggleFavorite}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
            resource.favorite ? "text-amber-500" : "text-ink-muted/50 hover:text-ink",
          )}
        >
          <Star className="h-4 w-4" fill={resource.favorite ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label={resource.pinned ? "Unpin" : "Pin"}
          onClick={onTogglePinned}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
            resource.pinned ? "text-accent" : "text-ink-muted/50 hover:text-ink",
          )}
        >
          <Pin className="h-4 w-4" fill={resource.pinned ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label="Delete resource"
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted/50 transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
