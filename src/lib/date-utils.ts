import { differenceInCalendarDays, format, parseISO } from "date-fns";

export const DATE_FORMAT = "yyyy-MM-dd";

/** Today as "yyyy-MM-dd" in the user's local timezone. */
export const todayStr = (): string => format(new Date(), DATE_FORMAT);

/** "2026-11-06" -> "Nov 6" */
export const formatShort = (iso: string): string =>
  format(parseISO(iso), "MMM d");

/** Days from `from` to `to` (negative if `to` is earlier). */
export const daysBetween = (from: string, to: string): number =>
  differenceInCalendarDays(parseISO(to), parseISO(from));

export interface DueInfo {
  text: string;
  tone: "overdue" | "soon" | "normal";
}

/** "2026-11-14" -> { text: "Tomorrow", tone: "soon" } */
export function describeDue(due: string, isDone: boolean): DueInfo {
  const diff = daysBetween(todayStr(), due);
  if (isDone) return { text: formatShort(due), tone: "normal" };
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, tone: "overdue" };
  if (diff === 0) return { text: "Today", tone: "soon" };
  if (diff === 1) return { text: "Tomorrow", tone: "soon" };
  return { text: formatShort(due), tone: "normal" };
}
