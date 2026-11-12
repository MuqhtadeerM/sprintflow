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
