import { db, saveSettings } from "@/lib/db";
import { DB_VERSION } from "@/lib/constants";
import type {
  AppSettings,
  DayRecord,
  ExportBundle,
  HabitDef,
  RecurringTask,
  Template,
} from "@/types";

/** Serialize the entire local database into a portable JSON bundle. */
export async function exportAll(): Promise<ExportBundle> {
  const [days, habits, templates, recurring, settings] = await Promise.all([
    db.days.toArray(),
    db.habits.toArray(),
    db.templates.toArray(),
    db.recurring.toArray(),
    db.settings.get("app"),
  ]);

  return {
    version: DB_VERSION,
    exportedAt: Date.now(),
    days,
    habits,
    templates,
    recurring,
    settings: settings ?? null,
  };
}

/** Trigger a browser download of the export bundle. */
export function downloadExport(bundle: ExportBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-os-backup-${new Date(bundle.exportedAt)
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export class ImportError extends Error {}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Validate a parsed bundle's shape before we trust it. Throws on invalid data. */
export function validateBundle(data: unknown): ExportBundle {
  if (!isRecord(data)) throw new ImportError("File is not a valid backup.");
  const arrays: (keyof ExportBundle)[] = [
    "days",
    "habits",
    "templates",
    "recurring",
  ];
  for (const key of arrays) {
    if (!Array.isArray(data[key])) {
      throw new ImportError(`Backup is missing the "${key}" section.`);
    }
  }

  // Spot-check the shape of a day record if present.
  const days = data.days as unknown[];
  if (days.length > 0) {
    const sample = days[0];
    if (!isRecord(sample) || typeof sample.date !== "string" || !Array.isArray(sample.tasks)) {
      throw new ImportError("Backup contains malformed day records.");
    }
  }

  return {
    version: typeof data.version === "number" ? data.version : DB_VERSION,
    exportedAt: typeof data.exportedAt === "number" ? data.exportedAt : Date.now(),
    days: data.days as DayRecord[],
    habits: data.habits as HabitDef[],
    templates: data.templates as Template[],
    recurring: data.recurring as RecurringTask[],
    settings: (isRecord(data.settings) ? data.settings : null) as AppSettings | null,
  };
}

/** Replace all local data with a validated bundle. */
export async function importAll(bundle: ExportBundle): Promise<void> {
  await db.transaction(
    "rw",
    db.days,
    db.habits,
    db.templates,
    db.recurring,
    db.settings,
    async () => {
      await Promise.all([
        db.days.clear(),
        db.habits.clear(),
        db.templates.clear(),
        db.recurring.clear(),
      ]);
      await db.days.bulkPut(bundle.days);
      await db.habits.bulkPut(bundle.habits);
      await db.templates.bulkPut(bundle.templates);
      await db.recurring.bulkPut(bundle.recurring);
    },
  );

  if (bundle.settings) {
    const { accent, notificationsEnabled, reviewEnabled, theme } =
      bundle.settings;
    await saveSettings({ accent, notificationsEnabled, reviewEnabled, theme });
  }
}

/** Read a File as parsed, validated bundle. */
export async function readBundleFile(file: File): Promise<ExportBundle> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new ImportError("Could not parse the file as JSON.");
  }
  return validateBundle(parsed);
}
