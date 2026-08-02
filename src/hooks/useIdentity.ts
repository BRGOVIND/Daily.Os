"use client";

import { useCallback, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getIdentity, renameIdentity } from "@/lib/db";
import type { Identity } from "@/types";

const LOADING: Identity = { id: "me", actorId: "", name: "You", handle: "", createdAt: 0 };

/** The local identity (the "me" actor), created on demand, with a rename API. */
export function useIdentity(): {
  identity: Identity;
  loading: boolean;
  rename: (name: string, handle: string) => Promise<void>;
} {
  const stored = useLiveQuery(() => db.identity.get("me"), []);

  // Ensure the identity row exists (idempotent; covers first run / older DBs).
  useEffect(() => {
    void getIdentity();
  }, []);

  const rename = useCallback(
    (name: string, handle: string) => renameIdentity(name, handle),
    [],
  );

  return { identity: stored ?? LOADING, loading: stored === undefined, rename };
}
