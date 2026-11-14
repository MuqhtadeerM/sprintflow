import type { DataState } from "@/types";

/** Everything that belongs in a database. `currentUserId` is session data, so it is excluded. */
export type RemoteData = Omit<DataState, "currentUserId">;
export type CollectionName = keyof RemoteData;

export const COLLECTIONS: CollectionName[] = [
  "workspaces",
  "projects",
  "sprints",
  "columns",
  "tasks",
  "labels",
  "users",
  "dependencies",
  "activities",
];

export interface Entity {
  id: string;
}

/** What happened to one collection: rows to insert/update, and ids to remove. */
export interface ChangeSet {
  collection: CollectionName;
  upserts: Entity[];
  deletes: string[];
}

export interface DataSource {
  /** Returns everything, or null if the source is empty (first run). */
  load(): Promise<RemoteData | null>;
  /** Persists changes, in order. Must throw if saving fails. */
  apply(changes: ChangeSet[]): Promise<void>;
}

export function createEmptyData(): RemoteData {
  return {
    workspaces: [],
    projects: [],
    sprints: [],
    columns: [],
    tasks: [],
    labels: [],
    users: [],
    dependencies: [],
    activities: [],
  };
}
