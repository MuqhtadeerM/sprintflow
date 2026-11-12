"use client";

import { useRef } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { StatusBadge } from "@/components/shared/status-badge";
import { LabelChip } from "@/components/shared/label-chip";
import { ProgressRing } from "@/components/shared/progress-ring";
import { UserAvatar } from "@/components/shared/user-avatar";
import { describeDue, formatShort } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Column, Label, Task, User } from "@/types";

export type ColumnKey =
  | "status"
  | "priority"
  | "assignee"
  | "labels"
  | "start"
  | "due"
  | "progress"
  | "hours";

export type SortKey = "title" | Exclude<ColumnKey, "labels">;
export type SortDir = "asc" | "desc";

export const COLUMN_DEFS: { key: ColumnKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "assignee", label: "Assignee" },
  { key: "labels", label: "Labels" },
  { key: "start", label: "Start" },
  { key: "due", label: "Due" },
  { key: "progress", label: "Progress" },
  { key: "hours", label: "Est. hours" },
];

interface TaskTableProps {
  tasks: Task[];
  columns: Column[];
  users: User[];
  labels: Label[];
  visible: Set<ColumnKey>;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "group inline-flex items-center gap-1 rounded text-xs font-semibold uppercase tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <Icon
        className={cn(
          "size-3 transition-opacity",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-60",
        )}
      />
    </button>
  );
}

function DueCell({ task, done }: { task: Task; done: boolean }) {
  if (!task.dueDate) return <span className="text-muted-foreground">—</span>;
  const info = describeDue(task.dueDate, done);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm tabular-nums",
        info.tone === "overdue" && "font-medium text-red-600 dark:text-red-400",
        info.tone === "soon" &&
          "font-medium text-amber-600 dark:text-amber-400",
      )}
    >
      {info.tone === "overdue" && (
        <span
          className="animate-pulse-ring size-2 rounded-full bg-red-500"
          aria-hidden="true"
        />
      )}
      {info.text}
    </span>
  );
}

export function TaskTable({
  tasks,
  columns,
  users,
  labels,
  visible,
  sortKey,
  sortDir,
  onSort,
  selected,
  onToggle,
  onToggleAll,
}: TaskTableProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  const columnById = new Map(columns.map((c) => [c.id, c]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const labelById = new Map(labels.map((l) => [l.id, l]));

  const allSelected =
    tasks.length > 0 && tasks.every((t) => selected.has(t.id));
  const someSelected = tasks.some((t) => selected.has(t.id));

  // Moves the spotlight by writing CSS directly: no React re-render per mouse move.
  const moveGlow = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    glowRef.current?.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    glowRef.current?.style.setProperty("--my", `${e.clientY - rect.top}px`);
    glowRef.current?.style.setProperty("opacity", "1");
  };
  const hideGlow = () => glowRef.current?.style.setProperty("opacity", "0");

  const rowData = tasks.map((task) => {
    const column = columnById.get(task.columnId);
    return {
      task,
      column,
      assignee: task.assigneeId ? userById.get(task.assigneeId) : undefined,
      taskLabels: task.labelIds
        .map((id) => labelById.get(id))
        .filter((l): l is Label => l !== undefined),
      done: column?.statusKey === "done",
    };
  });

  return (
    <>
      {/* ---------- Desktop / tablet: table ---------- */}
      <div
        className="relative hidden overflow-hidden rounded-2xl border bg-card md:block"
        onMouseMove={moveGlow}
        onMouseLeave={hideGlow}
      >
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            background:
              "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)",
          }}
        />
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="w-10 px-3 py-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onCheckedChange={(checked) => onToggleAll(checked === true)}
                    aria-label="Select all tasks"
                  />
                </th>
                <th
                  className="px-3 py-3"
                  aria-sort={
                    sortKey === "title"
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <SortHeader
                    label="Task"
                    sortKey="title"
                    current={sortKey}
                    dir={sortDir}
                    onSort={onSort}
                  />
                </th>
                {COLUMN_DEFS.filter((c) => visible.has(c.key)).map((c) => (
                  <th
                    key={c.key}
                    className="px-3 py-3"
                    aria-sort={
                      sortKey === c.key
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                  >
                    {c.key === "labels" ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Labels
                      </span>
                    ) : (
                      <SortHeader
                        label={c.label}
                        sortKey={c.key}
                        current={sortKey}
                        dir={sortDir}
                        onSort={onSort}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowData.map(
                ({ task, column, assignee, taskLabels, done }, i) => (
                  <tr
                    key={task.id}
                    data-selected={selected.has(task.id)}
                    className="animate-row-in border-b last:border-b-0 transition-colors hover:bg-muted/40 data-[selected=true]:bg-primary/5"
                    style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                  >
                    <td className="px-3 py-3">
                      <Checkbox
                        checked={selected.has(task.id)}
                        onCheckedChange={() => onToggle(task.id)}
                        aria-label={`Select ${task.title}`}
                      />
                    </td>
                    <td className="max-w-[320px] px-3 py-3">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          done && "text-muted-foreground line-through",
                        )}
                      >
                        {task.title}
                      </p>
                    </td>
                    {visible.has("status") && (
                      <td className="px-3 py-3">
                        {column && (
                          <StatusBadge
                            statusKey={column.statusKey}
                            label={column.name}
                          />
                        )}
                      </td>
                    )}
                    {visible.has("priority") && (
                      <td className="px-3 py-3">
                        <PriorityIndicator priority={task.priority} />
                      </td>
                    )}
                    {visible.has("assignee") && (
                      <td className="px-3 py-3">
                        {assignee ? (
                          <span className="inline-flex items-center gap-2 text-sm">
                            <UserAvatar user={assignee} size={22} />
                            <span className="hidden truncate lg:inline">
                              {assignee.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </td>
                    )}
                    {visible.has("labels") && (
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {taskLabels.map((l) => (
                            <LabelChip key={l.id} label={l} />
                          ))}
                        </div>
                      </td>
                    )}
                    {visible.has("start") && (
                      <td className="px-3 py-3 text-sm tabular-nums text-muted-foreground">
                        {task.startDate ? formatShort(task.startDate) : "—"}
                      </td>
                    )}
                    {visible.has("due") && (
                      <td className="px-3 py-3">
                        <DueCell task={task} done={done} />
                      </td>
                    )}
                    {visible.has("progress") && (
                      <td className="px-3 py-3">
                        <ProgressRing value={task.progress} />
                      </td>
                    )}
                    {visible.has("hours") && (
                      <td className="px-3 py-3 text-sm tabular-nums text-muted-foreground">
                        {task.estimatedHours}h
                      </td>
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Phone: cards ---------- */}
      <ul className="space-y-3 md:hidden">
        {rowData.map(({ task, column, assignee, taskLabels, done }, i) => (
          <li
            key={task.id}
            data-selected={selected.has(task.id)}
            className="animate-row-in rounded-2xl border bg-card p-4 transition-colors data-[selected=true]:border-primary/50 data-[selected=true]:bg-primary/5"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selected.has(task.id)}
                onCheckedChange={() => onToggle(task.id)}
                aria-label={`Select ${task.title}`}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    done && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {column && (
                    <StatusBadge
                      statusKey={column.statusKey}
                      label={column.name}
                    />
                  )}
                  <PriorityIndicator
                    priority={task.priority}
                    showLabel={false}
                  />
                  <DueCell task={task} done={done} />
                </div>
                <div className="flex flex-wrap gap-1">
                  {taskLabels.map((l) => (
                    <LabelChip key={l.id} label={l} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <ProgressRing value={task.progress} />
                {assignee && <UserAvatar user={assignee} size={22} />}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
