"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Plus,
  SearchX,
  X,
} from "lucide-react";
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
import { NativeSelect } from "@/components/shared/native-select";
import {
  TaskTable,
  COLUMN_DEFS,
  type ColumnKey,
  type SortDir,
  type SortKey,
} from "./task-table";
import { BulkDock } from "./bulk-dock";
import { useProjectTasks } from "@/hooks/use-project-tasks";
import { useFilters } from "@/hooks/use-filters";
import { hasActiveFilters } from "@/lib/filter-utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { openCreateTask, openTask } from "@/store/slices/ui-slice";
import { PRIORITY_META } from "@/lib/task-meta";
import type { Column, Task, User } from "@/types";

interface ListViewProps {
  projectId: string;
  sprintId: string | null;
}

const PAGE_SIZES = [10, 25, 50];

function compareTasks(
  a: Task,
  b: Task,
  key: SortKey,
  columnById: Map<string, Column>,
  userById: Map<string, User>,
): number {
  const nullsLast = (x: string | number | null, y: string | number | null) => {
    if (x === null && y === null) return 0;
    if (x === null) return 1; // missing values sink to the bottom
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
  const dispatch = useAppDispatch();
  const tasks = useProjectTasks(projectId, sprintId); // already filtered
  const { filters, clearAll } = useFilters();
  const allColumns = useAppSelector((s) => s.data.columns);
  const users = useAppSelector((s) => s.data.users);
  const labels = useAppSelector((s) => s.data.labels);

  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
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
    const columnById = new Map(allColumns.map((c) => [c.id, c] as const));
    const userById = new Map(users.map((u) => [u.id, u] as const));
    const sign = sortDir === "asc" ? 1 : -1;
    return [...tasks].sort((a, b) => {
      const result = sign * compareTasks(a, b, sortKey, columnById, userById);
      return result !== 0 ? result : a.order - b.order;
    });
  }, [tasks, allColumns, users, sortKey, sortDir]);

  // Derived, not stored: if filters shrink the list, the page clamps by itself.
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [rows, safePage, pageSize],
  );

  // Selections for tasks that were deleted or filtered out are ignored.
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
    setPage(1);
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // "Select all" applies to the rows on this page.
  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const t of pageRows) {
        if (checked) next.add(t.id);
        else next.delete(t.id);
      }
      return next;
    });

  const toggleColumn = (key: ColumnKey) =>
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const filtered = hasActiveFilters(filters);
  const from = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, rows.length);

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {rows.length} task{rows.length === 1 ? "" : "s"}
          {filtered && " match your filters"}
          {visibleSelected.length > 0 &&
            ` · ${visibleSelected.length} selected`}
        </p>

        <Button
          size="sm"
          className="ml-auto"
          onClick={() => dispatch(openCreateTask())}
        >
          <Plus className="size-4" />
          New task
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
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
            filtered
              ? "No tasks match your filters"
              : "No tasks in this sprint yet"
          }
          description={
            filtered
              ? "Try removing a filter, or clear them all to see every task."
              : "Tasks you create will show up here, in every view."
          }
          action={
            filtered ? (
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="size-4" />
                Clear all filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <TaskTable
            tasks={pageRows}
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
            onOpen={(id) => dispatch(openTask(id))}
          />

          {rows.length > PAGE_SIZES[0] && (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                Rows per page
                <NativeSelect
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-8 w-20"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </NativeSelect>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums text-muted-foreground">
                  {from}–{to} of {rows.length}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous page"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next page"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage(safePage + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </nav>
          )}
        </>
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
