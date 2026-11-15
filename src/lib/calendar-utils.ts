import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { DATE_FORMAT, daysBetween } from "./date-utils";
import { PRIORITY_META } from "./task-meta";
import type { Task } from "@/types";

export const CAL_MODES = ["month", "week", "day"] as const;
export type CalMode = (typeof CAL_MODES)[number];

const WEEK = { weekStartsOn: 1 as const }; // weeks start on Monday
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const toStr = (d: Date): string => format(d, DATE_FORMAT);

export function parseMode(value: string | null): CalMode {
  return (CAL_MODES as readonly string[]).includes(value ?? "")
    ? (value as CalMode)
    : "month";
}

/** URL value -> a valid date string. Garbage falls back to today. */
export function parseAnchor(value: string | null, today: string): string {
  if (value && DATE_RE.test(value) && isValid(parseISO(value))) return value;
  return today;
}

/** Every day string the grid must show for this mode. */
export function visibleDays(mode: CalMode, anchor: string): string[] {
  const d = parseISO(anchor);
  if (mode === "day") return [anchor];
  const range =
    mode === "week"
      ? { start: startOfWeek(d, WEEK), end: endOfWeek(d, WEEK) }
      : {
          start: startOfWeek(startOfMonth(d), WEEK),
          end: endOfWeek(endOfMonth(d), WEEK),
        };
  return eachDayOfInterval(range).map(toStr);
}

export function shiftAnchor(
  mode: CalMode,
  anchor: string,
  dir: 1 | -1,
): string {
  const d = parseISO(anchor);
  if (mode === "month") return toStr(addMonths(d, dir));
  if (mode === "week") return toStr(addWeeks(d, dir));
  return toStr(addDays(d, dir));
}

export function titleFor(mode: CalMode, anchor: string): string {
  const d = parseISO(anchor);
  if (mode === "month") return format(d, "MMMM yyyy");
  if (mode === "day") return format(d, "EEEE, d MMMM yyyy");
  const start = startOfWeek(d, WEEK);
  const end = endOfWeek(d, WEEK);
  return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
}

export function shiftDate(date: string, days: number): string {
  return toStr(addDays(parseISO(date), days));
}

/** Tasks grouped by due date, most urgent first. Tasks without a due date are skipped. */
export function groupByDate(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const list = map.get(task.dueDate) ?? [];
    list.push(task);
    map.set(task.dueDate, list);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank ||
        a.order - b.order,
    );
  }
  return map;
}

/** New dates after dropping a task on `newDate`. The duration is preserved. */
export function rescheduled(
  task: Task,
  newDate: string,
): { startDate: string | null; dueDate: string } {
  if (!task.dueDate) return { startDate: newDate, dueDate: newDate };
  const delta = daysBetween(task.dueDate, newDate);
  return {
    startDate: task.startDate ? shiftDate(task.startDate, delta) : null,
    dueDate: newDate,
  };
}
