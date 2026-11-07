import type { Middleware } from "@reduxjs/toolkit";
import type { DataState } from "@/types";

const STORAGE_KEY = "sprintflow:v1";

export function loadData(): DataState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DataState;
    // Minimal sanity check so a corrupted save can't crash the app.
    if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.columns))
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveData(data: DataState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked (private mode). Failing silently is fine for a mock app.
  }
}

export function clearSavedData(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Saves the data slice 300ms after it last changed. */
export const persistenceMiddleware: Middleware<object, { data: DataState }> = (
  api,
) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (next) => (action) => {
    const before = api.getState().data;
    const result = next(action);
    const after = api.getState().data;
    if (after !== before) {
      clearTimeout(timer);
      timer = setTimeout(() => saveData(after), 300);
    }
    return result;
  };
};
