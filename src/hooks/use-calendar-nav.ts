"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { todayStr } from "@/lib/date-utils";
import { parseAnchor, parseMode, type CalMode } from "@/lib/calendar-utils";

export function useCalendarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = todayStr();
  const mode = parseMode(searchParams.get("cal"));
  const anchor = parseAnchor(searchParams.get("date"), today);

  // Changes several params in ONE navigation, keeping filters, sprint and view.
  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const dateParam = (date: string) => (date === today ? null : date);

  return {
    mode,
    anchor,
    today,
    setMode: (m: CalMode) => update({ cal: m === "month" ? null : m }),
    setAnchor: (date: string) => update({ date: dateParam(date) }),
    /** Jump to the day view of one date (used by "+N more" and the day numbers). */
    zoomTo: (date: string) => update({ cal: "day", date: dateParam(date) }),
  };
}
