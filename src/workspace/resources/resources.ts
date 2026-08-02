/**
 * Resource-library helpers — filtering, sorting and tag extraction over a
 * workspace's saved references.
 */

import type { Resource, ResourceKind } from "@/types";

export interface ResourceFilter {
  query: string;
  kind: ResourceKind | "all";
  tag: string | null;
  favoritesOnly: boolean;
}

export const EMPTY_RESOURCE_FILTER: ResourceFilter = {
  query: "",
  kind: "all",
  tag: null,
  favoritesOnly: false,
};

/** All distinct tags across a set of resources, alphabetized. */
export function allTags(resources: Resource[]): string[] {
  const set = new Set<string>();
  for (const r of resources) for (const t of r.tags) set.add(t);
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Apply a filter, then sort pinned-first and newest-first. */
export function filterResources(
  resources: Resource[],
  filter: ResourceFilter,
): Resource[] {
  const q = filter.query.trim().toLowerCase();
  return resources
    .filter((r) => {
      if (filter.favoritesOnly && !r.favorite) return false;
      if (filter.kind !== "all" && r.kind !== filter.kind) return false;
      if (filter.tag && !r.tags.includes(filter.tag)) return false;
      if (q) {
        const hay = `${r.title} ${r.description} ${r.url} ${r.tags.join(" ")} ${r.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
}

/** Parse a comma / space separated tag string into a clean list. */
export function parseTags(input: string): string[] {
  return [
    ...new Set(
      input
        .split(/[,\n]/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0),
    ),
  ];
}
