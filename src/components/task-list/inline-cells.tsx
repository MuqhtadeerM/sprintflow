"use client";

import { PriorityIndicator } from "@/components/shared/priority-indicator";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useTaskActions } from "@/hooks/use-task-actions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateTask } from "@/store/slices/data-slice";
import { PRIORITIES, PRIORITY_META } from "@/lib/task-meta";
import type { Priority, Task } from "@/types";

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
