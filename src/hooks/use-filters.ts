"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EMPTY_FILTERS, parseFilters, writeFilters } from "@/lib/filter-utils";
import type { FilterState, Priority, StatusKey } from "@/types";

function toggled<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export function useFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const key = searchParams.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(key)), [key]);

  // The newest query string we know of. router.replace is not instant, so two
  // quick clicks would otherwise both start from the same stale URL.
  const latest = useRef(key);
  useEffect(() => {
    latest.current = key;
  }, [key]);

  const update = useCallback(
    (change: (current: FilterState) => FilterState) => {
      const params = new URLSearchParams(latest.current);
      writeFilters(params, change(parseFilters(params)));
      const qs = params.toString();
      latest.current = qs;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const setFilters = useCallback(
    (patch: Partial<FilterState>) => update((f) => ({ ...f, ...patch })),
    [update],
  );

  const toggleAssignee = useCallback(
    (id: string) =>
      update((f) => ({ ...f, assigneeIds: toggled(f.assigneeIds, id) })),
    [update],
  );
  const toggleLabel = useCallback(
    (id: string) =>
      update((f) => ({ ...f, labelIds: toggled(f.labelIds, id) })),
    [update],
  );
  const togglePriority = useCallback(
    (p: Priority) =>
      update((f) => ({ ...f, priorities: toggled(f.priorities, p) })),
    [update],
  );
  const toggleStatus = useCallback(
    (s: StatusKey) =>
      update((f) => ({ ...f, statuses: toggled(f.statuses, s) })),
    [update],
  );
  const clearAll = useCallback(
    () => update(() => ({ ...EMPTY_FILTERS })),
    [update],
  );

  return {
    filters,
    setFilters,
    toggleAssignee,
    toggleLabel,
    togglePriority,
    toggleStatus,
    clearAll,
  };
}
