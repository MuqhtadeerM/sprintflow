import {
  COLLECTIONS,
  type ChangeSet,
  type Entity,
  type RemoteData,
} from "./types";

/** Compares two snapshots and returns only what changed. */
export function diffState(before: RemoteData, after: RemoteData): ChangeSet[] {
  const changes: ChangeSet[] = [];

  for (const name of COLLECTIONS) {
    const prev: Entity[] = before[name];
    const next: Entity[] = after[name];
    // Immer keeps the same array reference when nothing changed: skip instantly.
    if (prev === next) continue;

    const prevById = new Map(prev.map((e) => [e.id, e] as const));
    const nextIds = new Set<string>();
    const upserts: Entity[] = [];

    for (const entity of next) {
      nextIds.add(entity.id);
      // Same reference = untouched row. Only new or modified rows are sent.
      if (prevById.get(entity.id) !== entity) upserts.push(entity);
    }
    const deletes = prev.filter((e) => !nextIds.has(e.id)).map((e) => e.id);

    if (upserts.length > 0 || deletes.length > 0) {
      changes.push({ collection: name, upserts, deletes });
    }
  }
  return changes;
}
