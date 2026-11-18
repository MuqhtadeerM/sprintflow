"use client";

import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { CommitInput } from "@/components/shared/commit-input";
import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Input } from "@/components/ui/input";
import { useTaskActions } from "@/hooks/use-task-actions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTaskDates, updateTask } from "@/store/slices/data-slice";
import { describeDue } from "@/lib/date-utils";
import { PRIORITIES, PRIORITY_META } from "@/lib/task-meta";
import { cn } from "@/lib/utils";
import type { Priority, Task } from "@/types";

/* ---------- select overlays (status, priority, assignee) ---------- */

interface OverlayProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  children: React.ReactNode;
}

function Overlay({ label, value, options, onChange, children }: OverlayProps) {
  return (
    <span className="relative -mx-1.5 inline-flex rounded-md px-1.5 py-0.5 transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-muted">
      {children}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer bg-background text-foreground opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

export function InlineStatus({ task }: { task: Task }) {
  const { moveToColumn } = useTaskActions();
  const all = useAppSelector((s) => s.data.columns);
  const columns = all
    .filter((c) => c.projectId === task.projectId)
    .sort((a, b) => a.order - b.order);
  const current = columns.find((c) => c.id === task.columnId);
  if (!current) return null;

  return (
    <Overlay
      label={`Status of ${task.title}`}
      value={task.columnId}
      options={columns.map((c) => ({ value: c.id, label: c.name }))}
      onChange={(id) => {
        const column = columns.find((c) => c.id === id);
        if (column) moveToColumn(task.id, column); // respects WIP limits, with a toast
      }}
    >
      <StatusBadge statusKey={current.statusKey} label={current.name} />
    </Overlay>
  );
}

export function InlinePriority({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  return (
    <Overlay
      label={`Priority of ${task.title}`}
      value={task.priority}
      options={PRIORITIES.map((p) => ({
        value: p,
        label: PRIORITY_META[p].label,
      }))}
      onChange={(value) => {
        const priority = value as Priority;
        dispatch(
          updateTask({
            id: task.id,
            changes: { priority },
            message: `Set priority to ${PRIORITY_META[priority].label}`,
          }),
        );
      }}
    >
      <PriorityIndicator priority={task.priority} />
    </Overlay>
  );
}

export function InlineAssignee({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.data.users);
  const assignee = users.find((u) => u.id === task.assigneeId);

  return (
    <Overlay
      label={`Assignee of ${task.title}`}
      value={task.assigneeId ?? ""}
      options={[
        { value: "", label: "Unassigned" },
        ...users.map((u) => ({ value: u.id, label: u.name })),
      ]}
      onChange={(id) => {
        const user = users.find((u) => u.id === id);
        dispatch(
          updateTask({
            id: task.id,
            changes: { assigneeId: user?.id ?? null },
            message: user ? `Assigned to ${user.name}` : "Unassigned",
          }),
        );
      }}
    >
      {assignee ? (
        <span className="inline-flex items-center gap-2 text-sm">
          <UserAvatar user={assignee} size={22} />
          <span className="hidden truncate lg:inline">{assignee.name}</span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Unassigned</span>
      )}
    </Overlay>
  );
}

/* ---------- title ---------- */

interface InlineTitleProps {
  task: Task;
  done: boolean;
  onOpen: (id: string) => void;
}

/** Click the title to open the drawer. Click the pencil to rename in place. */
export function InlineTitle({ task, done, onOpen }: InlineTitleProps) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const cancelled = useRef(false);

  const finish = () => {
    setEditing(false);
    if (cancelled.current) {
      cancelled.current = false;
      return;
    }
    const next = draft.trim();
    if (!next) {
      toast.error("A task needs a title");
      return;
    }
    if (next !== task.title) {
      dispatch(
        updateTask({
          id: task.id,
          changes: { title: next },
          message: `Renamed to “${next}”`,
        }),
      );
    }
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        maxLength={120}
        aria-label="Task title"
        className="h-8"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={finish}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelled.current = true;
            e.currentTarget.blur();
          }
        }}
      />
    );
  }

  return (
    <div className="group/title flex items-center gap-1">
      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className={cn(
          "block min-w-0 flex-1 truncate rounded text-left text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring",
          done && "text-muted-foreground line-through",
        )}
      >
        {task.title}
      </button>
      <button
        type="button"
        aria-label={`Rename ${task.title}`}
        onClick={() => {
          setDraft(task.title);
          setEditing(true);
        }}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-100 outline-none hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring md:opacity-0 md:group-hover/title:opacity-100"
      >
        <Pencil className="size-3.5" />
      </button>
    </div>
  );
}

/* ---------- dates and hours ---------- */

const DATE_INPUT =
  "h-8 rounded-md border border-transparent bg-transparent px-1 text-sm tabular-nums outline-none [color-scheme:light] hover:border-input focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]";

export function InlineDate({
  task,
  field,
}: {
  task: Task;
  field: "startDate" | "dueDate";
}) {
  const dispatch = useAppDispatch();
  const label = field === "startDate" ? "Start date" : "Due date";

  return (
    <input
      type="date"
      aria-label={`${label} of ${task.title}`}
      value={task[field] ?? ""}
      className={DATE_INPUT}
      onChange={(e) => {
        const value = e.target.value || null;
        const startDate = field === "startDate" ? value : task.startDate;
        const dueDate = field === "dueDate" ? value : task.dueDate;
        if (startDate && dueDate && startDate > dueDate) {
          toast.error("The start date can't be after the due date");
          return;
        }
        dispatch(setTaskDates({ id: task.id, startDate, dueDate }));
      }}
    />
  );
}

/** Due date picker, plus a "Today / 2d overdue" hint when it matters. */
export function InlineDue({ task, done }: { task: Task; done: boolean }) {
  const info = task.dueDate ? describeDue(task.dueDate, done) : null;
  return (
    <div className="flex items-center gap-2">
      <InlineDate task={task} field="dueDate" />
      {info && info.tone !== "normal" && (
        <span
          className={cn(
            "whitespace-nowrap text-xs font-medium",
            info.tone === "overdue"
              ? "text-red-600 dark:text-red-400"
              : "text-amber-600 dark:text-amber-400",
          )}
        >
          {info.text}
        </span>
      )}
    </div>
  );
}

export function InlineHours({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  return (
    <CommitInput
      inputMode="decimal"
      aria-label={`Estimated hours of ${task.title}`}
      value={String(task.estimatedHours)}
      className="h-8 w-16 border-transparent bg-transparent px-1.5 text-sm tabular-nums shadow-none hover:border-input focus-visible:border-input"
      onCommit={(next) => {
        const hours = Number(next);
        if (
          next.trim() === "" ||
          !Number.isFinite(hours) ||
          hours < 0 ||
          hours > 999
        ) {
          toast.error("Enter hours between 0 and 999");
          return;
        }
        dispatch(
          updateTask({
            id: task.id,
            changes: { estimatedHours: hours },
            message: `Estimated ${hours}h`,
          }),
        );
      }}
    />
  );
}
