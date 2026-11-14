import {
  COLLECTIONS,
  type ChangeSet,
  type CollectionName,
  type Entity,
  type RemoteData,
} from "./types";

export function applyChanges(
  data: RemoteData,
  changes: ChangeSet[],
): RemoteData {
  const next: Record<CollectionName, Entity[]> = { ...data };

  for (const change of changes) {
    const byId = new Map(
      next[change.collection].map((e) => [e.id, e] as const),
    );
    for (const id of change.deletes) byId.delete(id);
    for (const entity of change.upserts) byId.set(entity.id, entity);
    next[change.collection] = [...byId.values()];
  }
  // Collection names are checked at runtime; element shapes are trusted (see README).
  return next as unknown as RemoteData;
}

/** Runtime check for data arriving over HTTP. Never trust a request body. */
export function isChangeSets(value: unknown): value is ChangeSet[] {
  return (
    Array.isArray(value) &&
    value.every((c) => {
      if (typeof c !== "object" || c === null) return false;
      const change = c as Partial<ChangeSet>;
      return (
        COLLECTIONS.includes(change.collection as CollectionName) &&
        Array.isArray(change.upserts) &&
        Array.isArray(change.deletes)
      );
    })
  );
}
