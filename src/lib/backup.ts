import { COLLECTIONS, type RemoteData } from "@/lib/data-source/types";
import type { DataState } from "@/types";

export interface BackupFile {
  app: "sprintflow";
  version: 1;
  exportedAt: string;
  data: RemoteData;
}

export function makeBackup(state: DataState): BackupFile {
  const data = Object.fromEntries(
    COLLECTIONS.map((c) => [c, state[c]]),
  ) as unknown as RemoteData;
  return {
    app: "sprintflow",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

type ParseResult =
  | { ok: true; data: RemoteData }
  | { ok: false; error: string };

const hasId = (e: unknown): boolean =>
  typeof e === "object" &&
  e !== null &&
  typeof (e as { id?: unknown }).id === "string";

/** Never trust a file from disk: check the shape before it touches the store. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }
  const file = raw as Partial<BackupFile> | null;
  if (
    !file ||
    file.app !== "sprintflow" ||
    typeof file.data !== "object" ||
    file.data === null
  ) {
    return { ok: false, error: "That doesn't look like a SprintFlow backup." };
  }
  const data = file.data as unknown as Record<string, unknown>;
  for (const name of COLLECTIONS) {
    const list = data[name];
    if (!Array.isArray(list) || !list.every(hasId)) {
      return { ok: false, error: `The backup has a problem in “${name}”.` };
    }
  }
  if ((data.users as unknown[]).length === 0) {
    return { ok: false, error: "The backup has no users." };
  }
  return { ok: true, data: data as unknown as RemoteData };
}
