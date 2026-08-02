"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  addMission,
  deleteMission,
  updateMission,
  db,
  type MissionInput,
} from "@/lib/db";
import { createId } from "@/lib/utils";
import type { Milestone, Mission } from "@/types";

export interface UseMissionsResult {
  missions: Mission[];
  loading: boolean;
  create: (input: MissionInput) => Promise<string>;
  update: (id: string, patch: Partial<Omit<Mission, "id" | "createdAt">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  addMilestone: (missionId: string, title: string, targetDate?: string | null) => Promise<void>;
  toggleMilestone: (missionId: string, milestoneId: string) => Promise<void>;
  removeMilestone: (missionId: string, milestoneId: string) => Promise<void>;
  setArchived: (id: string, archived: boolean) => Promise<void>;
}

/**
 * Live-bound mission list plus CRUD, sorted newest-active first. All writes go
 * through the db helpers so task-detachment on delete stays transactional.
 */
export function useMissions(): UseMissionsResult {
  const raw = useLiveQuery(() => db.missions.toArray(), []);
  const missions = (raw ?? [])
    .slice()
    .sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      return b.createdAt - a.createdAt;
    });

  const patchMilestones = useCallback(
    async (missionId: string, fn: (list: Milestone[]) => Milestone[]) => {
      const mission = await db.missions.get(missionId);
      if (!mission) return;
      await updateMission(missionId, { milestones: fn(mission.milestones) });
    },
    [],
  );

  const create = useCallback((input: MissionInput) => addMission(input), []);
  const update = useCallback(
    (id: string, patch: Partial<Omit<Mission, "id" | "createdAt">>) =>
      updateMission(id, patch),
    [],
  );
  const remove = useCallback((id: string) => deleteMission(id), []);

  const addMilestone = useCallback(
    (missionId: string, title: string, targetDate: string | null = null) =>
      patchMilestones(missionId, (list) => [
        ...list,
        { id: createId(), title: title.trim(), done: false, targetDate },
      ]),
    [patchMilestones],
  );

  const toggleMilestone = useCallback(
    (missionId: string, milestoneId: string) =>
      patchMilestones(missionId, (list) =>
        list.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m)),
      ),
    [patchMilestones],
  );

  const removeMilestone = useCallback(
    (missionId: string, milestoneId: string) =>
      patchMilestones(missionId, (list) =>
        list.filter((m) => m.id !== milestoneId),
      ),
    [patchMilestones],
  );

  const setArchived = useCallback(
    (id: string, archived: boolean) => updateMission(id, { archived }),
    [],
  );

  return {
    missions,
    loading: raw === undefined,
    create,
    update,
    remove,
    addMilestone,
    toggleMilestone,
    removeMilestone,
    setArchived,
  };
}
