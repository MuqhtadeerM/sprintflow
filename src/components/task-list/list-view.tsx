"use client";

import { useMemo, useState } from "react";
import { Check, Columns3, Search, SearchX, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  TaskTable,
  COLUMN_DEFS,
  type ColumnKey,
  type SortDir,
  type SortKey,
} from "./task-table";
import { BulkDock } from "./bulk-dock";
import { useProjectTasks } from "@/hooks/use-project-tasks";
import { useAppSelector } from "@/store/hooks";
import { PRIORITY_META } from "@/lib/task-meta";
import type { Column, Task, User } from "@/types";

interface ListViewProps {
  projectId: string;
  sprintId: string | null;
}

function compareTasks(
  a: Task,
  b: Task,
  key: SortKey,
  columnById: Map<string, Column>,
  userById: Map<string, User>,
): number {
  const nullsLast = (x: string | number | null, y: string | number | null) => {
    if (x === null && y === null) return 0;
    if (x === null) return 1; // missing values always sink to the bottom
    if (y === null) return -1;
    return typeof x === "number" && typeof y === "number"
      ? x - y
      : String(x).localeCompare(String(y));
  };

  switch (key) {
    case "title":
      return a.title.localeCompare(b.title);
    case "status":
      return (
        (columnById.get(a.columnId)?.order ?? 0) -
        (columnById.get(b.columnId)?.order ?? 0)
      );
    case "priority":
      return PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank;
    case "assignee":
      return nullsLast(
        a.assigneeId ? (userById.get(a.assigneeId)?.name ?? null) : null,
        b.assigneeId ? (userById.get(b.assigneeId)?.name ?? null) : null,
      );
    case "start":
      return nullsLast(a.startDate, b.startDate);
    case "due":
      return nullsLast(a.dueDate, b.dueDate);
    case "progress":
      return a.progress - b.progress;
    case "hours":
      return a.estimatedHours - b.estimatedHours;
  }
}

export function ListView({ projectId, sprintId }: ListViewProps) {
  const tasks = useProjectTasks(projectId, sprintId);
  const allColumns = useAppSelector((s) => s.data.columns);
  const users = useAppSelector((s) => s.data.users);
  const labels = useAppSelector((s) => s.data.labels);

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState<Set<ColumnKey>>(
    new Set(["status", "priority", "assignee", "labels", "due", "progress"]),
  );

  const projectColumns = useMemo(
    () =>
      allColumns
        .filter((c) => c.projectId === projectId)
        .sort((a, b) => a.order - b.order),
    [allColumns, projectId],
  );

  const rows = useMemo(() => {
    const columnById = new Map(allColumns.map((c) => [c.id, c]));
    const userById = new Map(users.map((u) => [u.id, u]));
    const q = query.trim().toLowerCase();
    const matching = q
      ? tasks.filter((t) => t.title.toLowerCase().includes(q))
      : tasks;
    const sign = sortDir === "asc" ? 1 : -1;
    // Missing values must stay at the bottom in BOTH directions, so only flip real comparisons.
    return [...matching].sort((a, b) => {
      const flipped = sign * compareTasks(a, b, sortKey, columnById, userById);
      return flipped !== 0 ? flipped : a.order - b.order;
    });
  }, [tasks, allColumns, users, query, sortKey, sortDir]);

  // Drop selections for tasks that no longer exist or are filtered out.
  const visibleSelected = useMemo(() => {
    const ids = new Set(rows.map((t) => t.id));
    return [...selected].filter((id) => ids.has(id));
  }, [selected, rows]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(rows.map((t) => t.id)) : new Set());

  const toggleColumn = (key: ColumnKey) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            className="pl-8"
          />
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {rows.length} task{rows.length === 1 ? "" : "s"}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" className="ml-auto" />}
          >
            <Columns3 className="size-4" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Show columns</DropdownMenuLabel>
              {COLUMN_DEFS.map((c) => (
                <DropdownMenuItem
                  key={c.key}
                  className="justify-between"
                  onClick={() => toggleColumn(c.key)}
                >
                  {c.label}
                  {visible.has(c.key) && <Check className="size-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={
            query ? "No tasks match your search" : "No tasks in this sprint yet"
          }
          description={
            query
              ? `Nothing found for “${query}”. Try a different word.`
              : "Tasks you create will show up here, in every view."
          }
          action={
            query ? (
              <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                <X className="size-4" />
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <TaskTable
          tasks={rows}
          columns={allColumns}
          users={users}
          labels={labels}
          visible={visible}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          selected={new Set(visibleSelected)}
          onToggle={toggleOne}
          onToggleAll={toggleAll}
        />
      )}

      <BulkDock
        selectedIds={visibleSelected}
        projectColumns={projectColumns}
        users={users}
        onClear={() => setSelected(new Set())}
      />
    </div>
  );
}
