import { applyChanges } from "./apply";
import {
  createEmptyData,
  type ChangeSet,
  type DataSource,
  type RemoteData,
} from "./types";

const KEY = "sprintflow:v2";

function read(): RemoteData | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RemoteData;
    return Array.isArray(parsed.tasks) && Array.isArray(parsed.columns)
      ? parsed
      : null;
  } catch {
    return null; // corrupted save: treat as empty
  }
}

export const localSource: DataSource = {
  async load() {
    return read();
  },
  async apply(changes: ChangeSet[]) {
    const current = read() ?? createEmptyData();
    // setItem throws if storage is full: the sync layer shows that as an error.
    window.localStorage.setItem(
      KEY,
      JSON.stringify(applyChanges(current, changes)),
    );
  },
};
