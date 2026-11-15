"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/shared/native-select";
import { ALL_SPRINTS, useProjectContext } from "@/hooks/use-project-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addTask } from "@/store/slices/data-slice";
import { closeCreateTask, openTask } from "@/store/slices/ui-slice";
import { PRIORITIES, PRIORITY_META } from "@/lib/task-meta";
import type { Column, Priority, Sprint, User } from "@/types";

interface FormProps {
  projectId: string;
  sprintId: string;
  columns: Column[];
  users: User[];
  initialColumnId: string;
  initialDueDate: string;
}

function CreateForm({
  projectId,
  sprintId,
  columns,
  users,
  initialColumnId,
  initialDueDate,
}: FormProps) {
  const dispatch = useAppDispatch();
  const allTasks = useAppSelector((s) => s.data.tasks);

  const [title, setTitle] = useState("");
  const [columnId, setColumnId] = useState(initialColumnId);
  const [priority, setPriority] = useState<Priority>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return setError("Please enter a title.");
    if (trimmed.length > 120)
      return setError("Titles can be at most 120 characters.");

    const column = columns.find((c) => c.id === columnId);
    if (!column) return setError("Choose a status.");
    if (column.wipLimit !== null) {
      const count = allTasks.filter((t) => t.columnId === column.id).length;
      if (count >= column.wipLimit) {
        return setError(
          `“${column.name}” is full (limit ${column.wipLimit}). Pick another status.`,
        );
      }
    }

    const created = dispatch(
      addTask({
        projectId,
        sprintId,
        columnId,
        title: trimmed,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        startDate: dueDate || null,
      }),
    );
    dispatch(closeCreateTask());
    toast.success("Task created", {
      action: {
        label: "Open",
        onClick: () => dispatch(openTask(created.payload.id)),
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="new-task-title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="new-task-title"
          autoFocus
          value={title}
          maxLength={120}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error ? "new-task-error" : undefined}
          placeholder="What needs to be done?"
        />
        {error && (
          <p
            id="new-task-error"
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 text-sm font-medium">
          Status
          <NativeSelect
            value={columnId}
            onChange={(e) => {
              setColumnId(e.target.value);
              setError(null);
            }}
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Priority
          <NativeSelect
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Assignee
          <NativeSelect
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Due date
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => dispatch(closeCreateTask())}
        >
          Cancel
        </Button>
        <Button type="submit">Create task</Button>
      </DialogFooter>
    </form>
  );
}

export function CreateTaskDialog() {
  const dispatch = useAppDispatch();
  const dialog = useAppSelector((s) => s.ui.createDialog);
  const projects = useAppSelector((s) => s.data.projects);
  const allColumns = useAppSelector((s) => s.data.columns);
  const allSprints = useAppSelector((s) => s.data.sprints);
  const users = useAppSelector((s) => s.data.users);
  const { projectId: urlProjectId, sprintId: urlSprintId } =
    useProjectContext();

  // On pages without a project (like the dashboard), fall back to the first project.
  const projectId = projects.some((p) => p.id === urlProjectId)
    ? (urlProjectId as string)
    : projects[0]?.id;
  if (!projectId) return null;

  const columns = allColumns
    .filter((c) => c.projectId === projectId)
    .sort((a, b) => a.order - b.order);
  const sprints: Sprint[] = allSprints
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const sprintId =
    urlSprintId &&
    urlSprintId !== ALL_SPRINTS &&
    sprints.some((s) => s.id === urlSprintId)
      ? urlSprintId
      : (sprints[sprints.length - 1]?.id ?? "");

  const initialColumnId =
    columns.find((c) => c.id === dialog.columnId)?.id ??
    columns.find((c) => c.statusKey === "todo")?.id ??
    columns[0]?.id ??
    "";

  return (
    <Dialog
      open={dialog.open}
      onOpenChange={(open) => !open && dispatch(closeCreateTask())}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            It appears in every view right away. You can fill in the details
            afterwards.
          </DialogDescription>
        </DialogHeader>
        {dialog.open && (
          <CreateForm
            projectId={projectId}
            sprintId={sprintId}
            columns={columns}
            users={users}
            initialColumnId={initialColumnId}
            initialDueDate={dialog.dueDate ?? ""}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
