"use client";

import { useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { addTemplate, db, deleteTemplate } from "@/lib/db";
import type { Template, TemplateItem } from "@/types";

export interface UseTemplatesResult {
  templates: Template[];
  loading: boolean;
  create: (name: string, icon: string, items: TemplateItem[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useTemplates(): UseTemplatesResult {
  const templates = useLiveQuery(
    () => db.templates.orderBy("order").toArray(),
    [],
  );

  const create = useCallback(
    (name: string, icon: string, items: TemplateItem[]) =>
      addTemplate({ name, icon, items }),
    [],
  );

  const remove = useCallback((id: string) => deleteTemplate(id), []);

  return {
    templates: templates ?? [],
    loading: templates === undefined,
    create,
    remove,
  };
}
