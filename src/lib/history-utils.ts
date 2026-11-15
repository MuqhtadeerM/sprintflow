export interface HistoryEntry<T> {
  snapshot: T;
  label: string;
}

export interface History<T> {
  past: HistoryEntry<T>[];
  future: HistoryEntry<T>[];
}

export const HISTORY_LIMIT = 100;

export const emptyHistory = <T>(): History<T> => ({ past: [], future: [] });

/** `before` is the state BEFORE the change. A new change clears the redo stack. */
export function recordStep<T>(
  h: History<T>,
  before: T,
  label: string,
): History<T> {
  const past = [...h.past, { snapshot: before, label }];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { past, future: [] };
}

export function undoStep<T>(
  h: History<T>,
  current: T,
): { history: History<T>; restored: T } | null {
  const entry = h.past[h.past.length - 1];
  if (!entry) return null;
  return {
    restored: entry.snapshot,
    history: {
      past: h.past.slice(0, -1),
      future: [...h.future, { snapshot: current, label: entry.label }],
    },
  };
}

export function redoStep<T>(
  h: History<T>,
  current: T,
): { history: History<T>; restored: T } | null {
  const entry = h.future[h.future.length - 1];
  if (!entry) return null;
  return {
    restored: entry.snapshot,
    history: {
      past: [...h.past, { snapshot: current, label: entry.label }],
      future: h.future.slice(0, -1),
    },
  };
}

export const lastLabel = <T>(entries: HistoryEntry<T>[]): string | null =>
  entries.length > 0 ? entries[entries.length - 1].label : null;
