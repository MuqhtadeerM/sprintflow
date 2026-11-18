"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { CommitInput } from "@/components/shared/commit-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NativeSelect } from "@/components/shared/native-select";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Input } from "@/components/ui/input";
import { DescriptionEditor } from "./description-editor";
import { LabelsSection } from "./labels-section";
import { ChecklistSection } from "./checklist-section";
import { DependenciesSection } from "./dependencies-section";
import { AttachmentsSection } from "./attachments-section";
import { ActivitySection } from "./activity-section";
import { useTaskActions } from "@/hooks/use-task-actions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  deleteTask,
  setTaskDates,
  updateTask,
} from "@/store/slices/data-slice";
import { closeTask, openTask } from "@/store/slices/ui-slice";
import { PRIORITIES, PRIORITY_META } from "@/lib/task-meta";
import type { Priority, Task } from "@/types";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TaskDrawerBody({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const { moveToColumn, duplicate } = useTaskActions();
  const allColumns = useAppSelector((s) => s.data.columns);
  const allSprints = useAppSelector((s) => s.data.sprints);
  const users = useAppSelector((s) => s.data.users);
  const project = useAppSelector((s) =>
    s.data.projects.find((p) => p.id === task.projectId),
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressDraft, setProgressDraft] = useState<number | null>(null);

  const columns = useMemo(
    () =>
      allColumns
        .filter((c) => c.projectId === task.projectId)
        .sort((a, b) => a.order - b.order),
    [allColumns, task.projectId],
  );
  const sprints = useMemo(
    () =>
      allSprints
        .filter((s) => s.projectId === task.projectId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [allSprints, task.projectId],
  );

  const patch = (changes: Partial<Task>, message: string) =>
    dispatch(updateTask({ id: task.id, changes, message }));

  const changeDates = (startDate: string | null, dueDate: string | null) => {
    if (startDate && dueDate && startDate > dueDate) {
      toast.error("The start date can't be after the due date");
      return;
    }
    dispatch(setTaskDates({ id: task.id, startDate, dueDate }));
  };

  const commitProgress = () => {
    if (progressDraft !== null && progressDraft !== task.progress) {
      patch({ progress: progressDraft }, `Set progress to ${progressDraft}%`);
    }
    setProgressDraft(null);
  };
  const progress = progressDraft ?? task.progress;

  return (
    <>
      <div className="border-b px-5 pb-4 pt-5 pr-12">
        <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          {project && (
            <span
              className="size-2 rounded-sm"
              style={{ backgroundColor: project.color }}
              aria-hidden="true"
            />
          )}
          {project?.name} · created{" "}
          {formatDistanceToNow(parseISO(task.createdAt), { addSuffix: true })}
        </p>
        <SheetTitle className="sr-only">Task details</SheetTitle>
        <SheetDescription className="sr-only">
          Edit this task. Changes save automatically.
        </SheetDescription>
        <CommitInput
          value={task.title}
          aria-label="Task title"
          maxLength={120}
          className="h-auto border-transparent bg-transparent px-1 py-1 text-lg font-semibold shadow-none hover:border-input focus-visible:border-input"
          onCommit={(next) => {
            const trimmed = next.trim();
            if (!trimmed) {
              toast.error("A task needs a title");
              return;
            }
            patch({ title: trimmed }, `Renamed to “${trimmed}”`);
          }}
        />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Status">
            <NativeSelect
              value={task.columnId}
              onChange={(e) => {
                const column = columns.find((c) => c.id === e.target.value);
                if (column) moveToColumn(task.id, column);
              }}
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Priority">
            <NativeSelect
              value={task.priority}
              onChange={(e) => {
                const priority = e.target.value as Priority;
                patch(
                  { priority },
                  `Set priority to ${PRIORITY_META[priority].label}`,
                );
              }}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Assignee">
            <NativeSelect
              value={task.assigneeId ?? ""}
              onChange={(e) => {
                const user = users.find((u) => u.id === e.target.value);
                patch(
                  { assigneeId: user?.id ?? null },
                  user ? `Assigned to ${user.name}` : "Unassigned",
                );
              }}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Sprint">
            <NativeSelect
              value={task.sprintId}
              onChange={(e) => {
                const sprint = sprints.find((s) => s.id === e.target.value);
                if (sprint)
                  patch({ sprintId: sprint.id }, `Moved to ${sprint.name}`);
              }}
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label="Start date">
            <Input
              type="date"
              value={task.startDate ?? ""}
              max={task.dueDate ?? undefined}
              onChange={(e) =>
                changeDates(e.target.value || null, task.dueDate)
              }
            />
          </Field>

          <Field label="Due date">
            <Input
              type="date"
              value={task.dueDate ?? ""}
              min={task.startDate ?? undefined}
              onChange={(e) =>
                changeDates(task.startDate, e.target.value || null)
              }
            />
          </Field>

          <Field label="Estimated hours">
            <CommitInput
              inputMode="decimal"
              value={String(task.estimatedHours)}
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
                patch({ estimatedHours: hours }, `Estimated ${hours}h`);
              }}
            />
          </Field>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Progress
            </span>
            <div className="flex h-9 items-center gap-3">
              <ProgressRing value={progress} size={32} />
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                aria-label="Progress percentage"
                onChange={(e) => setProgressDraft(Number(e.target.value))}
                onPointerUp={commitProgress}
                onKeyUp={commitProgress}
                onBlur={commitProgress}
                className="h-1.5 flex-1 cursor-pointer accent-[var(--primary)]"
              />
            </div>
          </div>
        </div>

        <Section title="Labels">
          <LabelsSection task={task} />
        </Section>

        <Section title="Description">
          <DescriptionEditor task={task} />
        </Section>

        <Section title="Checklist">
          <ChecklistSection task={task} />
        </Section>

        <Section title="Dependencies">
          <DependenciesSection task={task} />
        </Section>

        <Section title="Attachments">
          <AttachmentsSection task={task} />
        </Section>

        <Section title="Discussion">
          <ActivitySection task={task} />
        </Section>
      </div>

      <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const newId = duplicate(task.id);
            if (newId) {
              toast.success("Task duplicated", {
                action: {
                  label: "Open copy",
                  onClick: () => dispatch(openTask(newId)),
                },
              });
            }
          }}
        >
          <Copy className="size-4" />
          Duplicate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-600 dark:text-red-400"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this task?"
        description={`“${task.title}” and its dependencies will be removed.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          dispatch(closeTask());
          dispatch(deleteTask(task.id));
          toast.success("Task deleted");
        }}
      />
    </>
  );
}

export function TaskDrawer() {
  const dispatch = useAppDispatch();
  const activeId = useAppSelector((s) => s.ui.activeTaskId);
  const task = useAppSelector(
    (s) => s.data.tasks.find((t) => t.id === activeId) ?? null,
  );

  return (
    <Sheet
      open={task !== null}
      onOpenChange={(open) => {
        if (!open) dispatch(closeTask());
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl"
      >
        {/* key = task id, so opening a different task starts with clean local state */}
        {task && <TaskDrawerBody key={task.id} task={task} />}
      </SheetContent>
    </Sheet>
  );
}
