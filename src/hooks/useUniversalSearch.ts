"use client";

import { useMemo } from "react";
import { useWorkspaceSnapshot } from "@/hooks/useWorkspaceSnapshot";
import { universalSearch, type SearchGroup } from "@/workspace";

export interface UseUniversalSearchResult {
  groups: SearchGroup[];
  total: number;
}

/**
 * Universal search across every entity type. Reads a single snapshot (inert
 * when `enabled` is false) and runs the pure {@link universalSearch} over it,
 * memoized on the snapshot and query.
 */
export function useUniversalSearch(
  query: string,
  enabled = true,
): UseUniversalSearchResult {
  const snapshot = useWorkspaceSnapshot(enabled);

  return useMemo(() => {
    const groups = enabled ? universalSearch(snapshot, query) : [];
    const total = groups.reduce((n, g) => n + g.hits.length, 0);
    return { groups, total };
  }, [enabled, snapshot, query]);
}
