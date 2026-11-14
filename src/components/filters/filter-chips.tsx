"use client";

import { X } from "lucide-react";
import { useFilters } from "@/hooks/use-filters";
import { useAppSelector } from "@/store/hooks";
import { formatShort } from "@/lib/date-utils";
import { hasActiveFilters, UNASSIGNED } from "@/lib/filter-utils";
import { PRIORITY_META, STATUS_META } from "@/lib/task-meta";

interface Chip {
  key: string;
  label: string;
  remove: () => void;
}

export function FilterChips() {
  const users = useAppSelector((s) => s.data.users);
  const labels = useAppSelector((s) => s.data.labels);
  const {
    filters: f,
    setFilters,
    toggleAssignee,
    toggleLabel,
    togglePriority,
    toggleStatus,
    clearAll,
  } = useFilters();

  if (!hasActiveFilters(f)) return null;

  const chips: Chip[] = [];

  if (f.search.trim()) {
    chips.push({
      key: "q",
      label: `“${f.search.trim()}”`,
      remove: () => setFilters({ search: "" }),
    });
  }
  f.assigneeIds.forEach((id) =>
    chips.push({
      key: `a-${id}`,
      label:
        id === UNASSIGNED
          ? "Unassigned"
          : (users.find((u) => u.id === id)?.name ?? "Unknown user"),
      remove: () => toggleAssignee(id),
    }),
  );
  f.priorities.forEach((p) =>
    chips.push({
      key: `p-${p}`,
      label: `${PRIORITY_META[p].label} priority`,
      remove: () => togglePriority(p),
    }),
  );
  f.statuses.forEach((s) =>
    chips.push({
      key: `s-${s}`,
      label: STATUS_META[s].label,
      remove: () => toggleStatus(s),
    }),
  );
  f.labelIds.forEach((id) =>
    chips.push({
      key: `l-${id}`,
      label: labels.find((l) => l.id === id)?.name ?? "Unknown label",
      remove: () => toggleLabel(id),
    }),
  );
  if (f.dateFrom || f.dateTo) {
    const label =
      f.dateFrom && f.dateTo
        ? `${formatShort(f.dateFrom)} – ${formatShort(f.dateTo)}`
        : f.dateFrom
          ? `From ${formatShort(f.dateFrom)}`
          : `Until ${formatShort(f.dateTo as string)}`;
    chips.push({
      key: "range",
      label,
      remove: () => setFilters({ dateFrom: null, dateTo: null }),
    });
  }
  if (f.overdueOnly) {
    chips.push({
      key: "overdue",
      label: "Overdue",
      remove: () => setFilters({ overdueOnly: false }),
    });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="animate-row-in inline-flex items-center gap-1 rounded-full border bg-card py-1 pl-3 pr-1 text-xs font-medium"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.remove}
            aria-label={`Remove filter: ${chip.label}`}
            className="rounded-full p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="rounded text-xs font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Clear all
      </button>
    </div>
  );
}
