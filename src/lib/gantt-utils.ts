import {
  addDays,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { shiftDate, toStr } from "./calendar-utils";
import { daysBetween } from "./date-utils";
import type { Task } from "@/types";

export const GANTT_ZOOMS = ["day", "week", "month"] as const;
export type GanttZoom = (typeof GANTT_ZOOMS)[number];

export const PX_PER_DAY: Record<GanttZoom, number> = {
  day: 40,
  week: 16,
  month: 5,
};
export const ROW_H = 44;
export const BAR_H = 28;

/** Inclusive date span of a task, "yyyy-MM-dd" strings. */
export interface Span {
  start: string;
  end: string;
}

/** A task with only one date becomes a one-day bar. No dates = no bar. */
export function spanOf(task: Task): Span | null {
  const a = task.startDate ?? task.dueDate;
  const b = task.dueDate ?? task.startDate;
  if (!a || !b) return null;
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

export function durationDays(span: Span): number {
  return daysBetween(span.start, span.end) + 1;
}

/** Whole-month range around all tasks, always including today. */
export function computeRange(
  spans: Span[],
  today: string,
): { start: string; days: number } {
  let min = today;
  let max = today;
  for (const s of spans) {
    if (s.start < min) min = s.start;
    if (s.end > max) max = s.end;
  }
  const start = toStr(startOfMonth(addDays(parseISO(min), -14)));
  const end = toStr(endOfMonth(addDays(parseISO(max), 30)));
  return { start, days: daysBetween(start, end) + 1 };
}

export type SegmentUnit = "day" | "week" | "month" | "year";

export interface Segment {
  key: string;
  label: string;
  left: number;
  width: number;
  weekend: boolean;
}

function keyAndLabel(
  d: Date,
  unit: SegmentUnit,
  long: boolean,
): { key: string; label: string } {
  switch (unit) {
    case "day":
      return { key: toStr(d), label: format(d, "d") };
    case "week": {
      const monday = startOfWeek(d, { weekStartsOn: 1 });
      return { key: toStr(monday), label: format(monday, "d MMM") };
    }
    case "month":
      return {
        key: format(d, "yyyy-MM"),
        label: format(d, long ? "MMMM yyyy" : "MMM"),
      };
    case "year":
      return { key: format(d, "yyyy"), label: format(d, "yyyy") };
  }
}

/** Header cells (and grid lines): consecutive days grouped by unit. */
export function buildSegments(
  start: string,
  days: number,
  ppd: number,
  unit: SegmentUnit,
  long = false,
): Segment[] {
  const base = parseISO(start);
  const segments: Segment[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(base, i);
    const { key, label } = keyAndLabel(d, unit, long);
    const last = segments[segments.length - 1];
    if (last && last.key === key) {
      last.width += ppd;
    } else {
      const weekend = unit === "day" && (getDay(d) === 0 || getDay(d) === 6);
      segments.push({ key, label, left: i * ppd, width: ppd, weekend });
    }
  }
  return segments;
}

export function tiersFor(zoom: GanttZoom): {
  top: SegmentUnit;
  bottom: SegmentUnit;
} {
  if (zoom === "day") return { top: "month", bottom: "day" };
  if (zoom === "week") return { top: "month", bottom: "week" };
  return { top: "year", bottom: "month" };
}

export type BarDragMode = "move" | "start" | "end";

/** Applies a whole-day delta. Resizing can never invert the span. */
export function applyDelta(base: Span, mode: BarDragMode, delta: number): Span {
  if (mode === "move") {
    return {
      start: shiftDate(base.start, delta),
      end: shiftDate(base.end, delta),
    };
  }
  if (mode === "start") {
    const start = shiftDate(base.start, delta);
    return { start: start > base.end ? base.end : start, end: base.end };
  }
  const end = shiftDate(base.end, delta);
  return { start: base.start, end: end < base.start ? base.start : end };
}

/** Finish-to-start: the successor must start AFTER the predecessor ends. */
export function isConflict(pred: Span, succ: Span): boolean {
  return succ.start <= pred.end;
}

/** Moves the successor to the day after the predecessor, keeping its duration. */
export function shiftAfter(pred: Span, succ: Span): Span {
  const start = shiftDate(pred.end, 1);
  return { start, end: shiftDate(start, daysBetween(succ.start, succ.end)) };
}

/** Right-angled connector from (x1,y1) to (x2,y2). Loops around when x2 is behind x1. */
export function arrowPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rowH: number,
): string {
  const gap = 12;
  if (x2 >= x1 + gap * 2) {
    return `M${x1},${y1} H${x1 + gap} V${y2} H${x2}`;
  }
  const midY = y1 + (y2 >= y1 ? rowH / 2 : -rowH / 2);
  return `M${x1},${y1} H${x1 + gap} V${midY} H${x2 - gap} V${y2} H${x2}`;
}
