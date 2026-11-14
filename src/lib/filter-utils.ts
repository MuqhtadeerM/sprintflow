import { EMPTY_FILTERS } from "@/types";
import type { Column, FilterState, Priority, StatusKey, Task } from "@/types";
import { isOverdue } from "./task-utils";

export const UNASSIGNED = "unassigned";

const PRIORITY_VALUES: readonly string[] = ["low", "medium", "high", "urgent"];
const STATUS_VALUES: readonly string[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const list = (value: string | null): string[] =>
  value ? [...new Set(value.split(",").filter(Boolean))] : [];

const validDate = (value: string | null): string | null =>
  value && DATE_RE.test(value) ? value : null;

/** URL -> FilterState. Unknown or malformed values are dropped, never trusted. */
export function parseFilters(params: URLSearchParams): FilterState {
  return {
    search: params.get("q") ?? "",
    assigneeIds: list(params.get("assignee")),
    labelIds: list(params.get("label")),
    priorities: list(params.get("priority")).filter((v): v is Priority =>
      PRIORITY_VALUES.includes(v),
    ),
    statuses: list(params.get("status")).filter((v): v is StatusKey =>
      STATUS_VALUES.includes(v),
    ),
    dateFrom: validDate(params.get("from")),
    dateTo: validDate(params.get("to")),
    overdueOnly: params.get("overdue") === "1",
  };
}

/** FilterState -> URL. Changes only filter keys, so view/sprint params survive. */
export function writeFilters(params: URLSearchParams, f: FilterState): void {
  const put = (key: string, value: string | null) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };
  put("q", f.search.trim() ? f.search : null);
  put("assignee", f.assigneeIds.join(",") || null);
  put("label", f.labelIds.join(",") || null);
  put("priority", f.priorities.join(",") || null);
  put("status", f.statuses.join(",") || null);
  put("from", f.dateFrom);
  put("to", f.dateTo);
  put("overdue", f.overdueOnly ? "1" : null);
}

/** Number of active filters, not counting the search box (it has its own UI). */
export function filterCount(f: FilterState): number {
  return (
    f.assigneeIds.length +
    f.labelIds.length +
    f.priorities.length +
    f.statuses.length +
    (f.dateFrom || f.dateTo ? 1 : 0) +
    (f.overdueOnly ? 1 : 0)
  );
}

export function hasActiveFilters(f: FilterState): boolean {
  return f.search.trim() !== "" || filterCount(f) > 0;
}

export function applyFilters(
  tasks: Task[],
  f: FilterState,
  columns: Column[],
  today: string,
): Task[] {
  // Same array back = same reference, so memoised consumers don't recompute.
  if (!hasActiveFilters(f)) return tasks;

  const q = f.search.trim().toLowerCase();
  const columnById = new Map(columns.map((c) => [c.id, c] as const));

  return tasks.filter((task) => {
    if (
      q &&
      !task.title.toLowerCase().includes(q) &&
      !task.description.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (
      f.assigneeIds.length > 0 &&
      !f.assigneeIds.includes(task.assigneeId ?? UNASSIGNED)
    ) {
      return false;
    }
    if (
      f.labelIds.length > 0 &&
      !task.labelIds.some((id) => f.labelIds.includes(id))
    ) {
      return false;
    }
    if (f.priorities.length > 0 && !f.priorities.includes(task.priority))
      return false;

    const status = columnById.get(task.columnId)?.statusKey;
    if (f.statuses.length > 0 && (!status || !f.statuses.includes(status)))
      return false;

    if (f.overdueOnly && !isOverdue(task, columns, today)) return false;

    if (f.dateFrom || f.dateTo) {
      const start = task.startDate ?? task.dueDate;
      const end = task.dueDate ?? task.startDate;
      if (!start || !end) return false;
      if (f.dateFrom && end < f.dateFrom) return false; // ends before the range
      if (f.dateTo && start > f.dateTo) return false; // starts after the range
    }
    return true;
  });
}

export { EMPTY_FILTERS };
