import type { Column, Task } from "@/types";

/** columnId -> ordered task ids. */
export type Items = Record<string, string[]>;

export function buildItems(columns: Column[], tasks: Task[]): Items {
  const items: Items = {};
  for (const column of columns) items[column.id] = [];
  for (const task of [...tasks].sort((a, b) => a.order - b.order)) {
    const list = items[task.columnId];
    if (list) list.push(task.id);
  }
  return items;
}

/** The column that holds `id`. `id` may be a column id (empty drop zone) or a task id. */
export function findContainer(items: Items, id: string): string | undefined {
  if (id in items) return id;
  return Object.keys(items).find((key) => items[key]?.includes(id));
}

/**
 * Converts "position among the VISIBLE cards" into "position among ALL cards
 * in the column", so filtered boards still drop in the right place.
 */
export function resolveIndex(
  fullColumnIds: string[],
  finalVisible: string[],
  taskId: string,
): number {
  const without = fullColumnIds.filter((id) => id !== taskId);
  const pos = finalVisible.indexOf(taskId);
  const next = finalVisible[pos + 1];
  const prev = finalVisible[pos - 1];
  if (next !== undefined) {
    const i = without.indexOf(next);
    if (i >= 0) return i;
  }
  if (prev !== undefined) {
    const i = without.indexOf(prev);
    if (i >= 0) return i + 1;
  }
  return without.length;
}

export type WipState = "none" | "ok" | "near" | "full" | "over";

export function wipState(count: number, limit: number | null): WipState {
  if (limit === null) return "none";
  if (count > limit) return "over";
  if (count === limit) return "full";
  if (limit >= 3 && count === limit - 1) return "near";
  return "ok";
}
