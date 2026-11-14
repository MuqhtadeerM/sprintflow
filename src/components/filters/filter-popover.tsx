"use client";

import { AlertTriangle, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ToggleChip } from "./toggle-chip";
import { useFilters } from "@/hooks/use-filters";
import { useAppSelector } from "@/store/hooks";
import { filterCount, UNASSIGNED } from "@/lib/filter-utils";
import { PRIORITIES, STATUS_META } from "@/lib/task-meta";
import type { StatusKey } from "@/types";

// Object.keys loses the key type, so we restore it once, here.
const STATUS_KEYS = Object.keys(STATUS_META) as StatusKey[];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={title} className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function FilterPopover() {
  const users = useAppSelector((s) => s.data.users);
  const labels = useAppSelector((s) => s.data.labels);
  const {
    filters,
    setFilters,
    toggleAssignee,
    toggleLabel,
    togglePriority,
    toggleStatus,
    clearAll,
  } = useFilters();

  const count = filterCount(filters);

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" className="gap-2" />}
      >
        <ListFilter className="size-4" />
        Filters
        {count > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold tabular-nums text-primary-foreground">
            {count}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="max-h-[75vh] w-[min(92vw,400px)] space-y-5 overflow-y-auto p-4"
      >
        <Section title="Assignee">
          {users.map((u) => (
            <ToggleChip
              key={u.id}
              pressed={filters.assigneeIds.includes(u.id)}
              onClick={() => toggleAssignee(u.id)}
              color={u.avatarColor}
            >
              <UserAvatar user={u} size={16} />
              {u.name.split(" ")[0]}
            </ToggleChip>
          ))}
          <ToggleChip
            pressed={filters.assigneeIds.includes(UNASSIGNED)}
            onClick={() => toggleAssignee(UNASSIGNED)}
          >
            Unassigned
          </ToggleChip>
        </Section>

        <Section title="Priority">
          {PRIORITIES.map((p) => (
            <ToggleChip
              key={p}
              pressed={filters.priorities.includes(p)}
              onClick={() => togglePriority(p)}
            >
              <PriorityIndicator priority={p} />
            </ToggleChip>
          ))}
        </Section>

        <Section title="Status">
          {STATUS_KEYS.map((s) => (
            <ToggleChip
              key={s}
              pressed={filters.statuses.includes(s)}
              onClick={() => toggleStatus(s)}
              color={STATUS_META[s].color}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: STATUS_META[s].color }}
                aria-hidden="true"
              />
              {STATUS_META[s].label}
            </ToggleChip>
          ))}
        </Section>

        <Section title="Labels">
          {labels.map((l) => (
            <ToggleChip
              key={l.id}
              pressed={filters.labelIds.includes(l.id)}
              onClick={() => toggleLabel(l.id)}
              color={l.color}
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: l.color }}
                aria-hidden="true"
              />
              {l.name}
            </ToggleChip>
          ))}
        </Section>

        <div role="group" aria-label="Date range" className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Date range
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-muted-foreground">
              From
              <Input
                type="date"
                value={filters.dateFrom ?? ""}
                max={filters.dateTo ?? undefined}
                onChange={(e) =>
                  setFilters({ dateFrom: e.target.value || null })
                }
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              To
              <Input
                type="date"
                value={filters.dateTo ?? ""}
                min={filters.dateFrom ?? undefined}
                onChange={(e) => setFilters({ dateTo: e.target.value || null })}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <ToggleChip
            pressed={filters.overdueOnly}
            onClick={() => setFilters({ overdueOnly: !filters.overdueOnly })}
            color="#ef4444"
          >
            <AlertTriangle className="size-3.5" />
            Overdue only
          </ToggleChip>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={count === 0 && !filters.search}
          >
            Clear all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
