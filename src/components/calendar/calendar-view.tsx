"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ChipBody,
  DraggableChip,
  type ChipInfo,
  type ChipSize,
} from "./calendar-chip";
import { useCalendarNav } from "@/hooks/use-calendar-nav";
import { useFilters } from "@/hooks/use-filters";
import { useProjectTasks } from "@/hooks/use-project-tasks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTaskDates } from "@/store/slices/data-slice";
import { openCreateTask, openTask } from "@/store/slices/ui-slice";
import {
  CAL_MODES,
  groupByDate,
  rescheduled,
  shiftAnchor,
  titleFor,
  visibleDays,
  type CalMode,
} from "@/lib/calendar-utils";
import { formatShort } from "@/lib/date-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { isOverdue } from "@/lib/task-utils";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const NEUTRAL = "#94a3b8";
const MONTH_LIMIT = 3;

type ColorBy = "priority" | "label";

interface DayCellProps {
  date: string;
  mode: CalMode;
  tasks: Task[];
  inMonth: boolean;
  today: string;
  describe: (task: Task) => ChipInfo;
  onOpen: (taskId: string) => void;
  onCreate: (date: string) => void;
  onZoom: (date: string) => void;
}

function DayCell({
  date,
  mode,
  tasks,
  inMonth,
  today,
  describe,
  onOpen,
  onCreate,
  onZoom,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}` });
  const d = parseISO(date);
  const isToday = date === today;
  const size: ChipSize = mode === "day" ? "md" : "sm";
  const shown = mode === "month" ? tasks.slice(0, MONTH_LIMIT) : tasks;
  const extra = tasks.length - shown.length;

  const chips = shown.map((task) => (
    <DraggableChip
      key={task.id}
      task={task}
      info={describe(task)}
      size={size}
      onOpen={onOpen}
    />
  ));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/day flex flex-col gap-1 p-1.5 transition-colors",
        mode === "month" && "min-h-[84px] md:min-h-[124px]",
        mode === "week" && "min-h-[110px] sm:min-h-[220px]",
        mode === "day" && "min-h-[320px]",
        mode === "month" && !inMonth ? "bg-muted" : "bg-card",
        isOver &&
          "bg-[color-mix(in_oklab,var(--primary)_14%,var(--card))] ring-2 ring-inset ring-primary/40",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onZoom(date)}
          aria-label={`Open ${format(d, "EEEE d MMMM")}`}
          className={cn(
            "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isToday
              ? "bg-primary text-primary-foreground"
              : inMonth
                ? "hover:bg-muted"
                : "text-muted-foreground hover:bg-background",
          )}
        >
          {mode === "week" ? format(d, "EEE d") : format(d, "d")}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 opacity-100 focus-visible:opacity-100 md:opacity-0 md:group-hover/day:opacity-100"
          aria-label={`Add a task on ${format(d, "d MMMM")}`}
          onClick={() => onCreate(date)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      {mode === "month" ? (
        <>
          {/* Desktop: readable, draggable chips */}
          <div className="hidden flex-col gap-1 md:flex">
            {chips}
            {extra > 0 && (
              <button
                type="button"
                onClick={() => onZoom(date)}
                className="rounded px-1 text-left text-[11px] font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                +{extra} more
              </button>
            )}
          </div>
          {/* Phone: dots. Tap to open the day. */}
          {tasks.length > 0 && (
            <button
              type="button"
              onClick={() => onZoom(date)}
              aria-label={`${tasks.length} task${tasks.length === 1 ? "" : "s"} on ${format(d, "d MMMM")}`}
              className="flex flex-wrap gap-1 rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              {tasks.slice(0, 6).map((task) => {
                const info = describe(task);
                return (
                  <span
                    key={task.id}
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: info.overdue ? "#ef4444" : info.color,
                    }}
                  />
                );
              })}
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-1.5">{chips}</div>
      )}

      {mode === "day" && tasks.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Nothing is due on this day. Use + to add a task.
        </p>
      )}
    </div>
  );
}

export function CalendarView({
  projectId,
  sprintId,
}: {
  projectId: string;
  sprintId: string | null;
}) {
  const dispatch = useAppDispatch();
  const tasks = useProjectTasks(projectId, sprintId); // filtered by sprint + URL filters
  const columns = useAppSelector((s) => s.data.columns);
  const users = useAppSelector((s) => s.data.users);
  const labels = useAppSelector((s) => s.data.labels);
  const { setFilters } = useFilters();
  const { mode, anchor, today, setMode, setAnchor, zoomTo } = useCalendarNav();

  const [colorBy, setColorBy] = useState<ColorBy>("priority");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Press and hold, so a quick swipe still scrolls the page on phones.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  const columnById = useMemo(
    () => new Map(columns.map((c) => [c.id, c] as const)),
    [columns],
  );
  const userById = useMemo(
    () => new Map(users.map((u) => [u.id, u] as const)),
    [users],
  );
  const labelById = useMemo(
    () => new Map(labels.map((l) => [l.id, l] as const)),
    [labels],
  );
  const taskById = useMemo(
    () => new Map(tasks.map((t) => [t.id, t] as const)),
    [tasks],
  );

  const describe = useCallback(
    (task: Task): ChipInfo => {
      const labelColor = task.labelIds
        .map((id) => labelById.get(id)?.color)
        .find(Boolean);
      return {
        color:
          colorBy === "priority"
            ? PRIORITY_META[task.priority].color
            : (labelColor ?? NEUTRAL),
        overdue: isOverdue(task, columns, today),
        done: columnById.get(task.columnId)?.statusKey === "done",
        assignee: task.assigneeId ? userById.get(task.assigneeId) : undefined,
      };
    },
    [colorBy, labelById, columns, columnById, userById, today],
  );

  const byDate = useMemo(() => groupByDate(tasks), [tasks]);
  const unscheduled = useMemo(
    () => tasks.filter((t) => t.dueDate === null),
    [tasks],
  );
  const days = useMemo(() => visibleDays(mode, anchor), [mode, anchor]);
  const overdueCount = useMemo(
    () => tasks.filter((t) => isOverdue(t, columns, today)).length,
    [tasks, columns, today],
  );
  const activeTask = activeId ? taskById.get(activeId) : undefined;

  const onOpen = useCallback(
    (id: string) => dispatch(openTask(id)),
    [dispatch],
  );
  const onCreate = useCallback(
    (date: string) => dispatch(openCreateTask({ dueDate: date })),
    [dispatch],
  );

  const handleDragStart = (e: DragStartEvent) =>
    setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId || !overId.startsWith("day:")) return;
    const task = taskById.get(String(e.active.id));
    if (!task) return;
    const date = overId.slice("day:".length);
    if (task.dueDate === date) return;

    const previous = { startDate: task.startDate, dueDate: task.dueDate };
    dispatch(setTaskDates({ id: task.id, ...rescheduled(task, date) }));
    toast.success(`Moved to ${formatShort(date)}`, {
      description: task.title,
      action: {
        label: "Undo",
        onClick: () => dispatch(setTaskDates({ id: task.id, ...previous })),
      },
    });
  };

  const monthKey = anchor.slice(0, 7);

  return (
    <div className="space-y-4">
      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous"
            onClick={() => setAnchor(shiftAnchor(mode, anchor, -1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next"
            onClick={() => setAnchor(shiftAnchor(mode, anchor, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAnchor(today)}
            disabled={anchor === today && mode !== "month"}
          >
            Today
          </Button>
        </div>

        <h2 className="min-w-0 text-base font-semibold" aria-live="polite">
          {titleFor(mode, anchor)}
        </h2>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {overdueCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-red-500/40 text-red-600 dark:text-red-400"
              onClick={() => setFilters({ overdueOnly: true })}
              title="Show only overdue tasks"
            >
              <AlertTriangle className="size-3.5" />
              {overdueCount} overdue
            </Button>
          )}

          <div
            role="group"
            aria-label="Color by"
            className="inline-flex rounded-lg border bg-muted/50 p-0.5"
          >
            {(["priority", "label"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={colorBy === c}
                onClick={() => setColorBy(c)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  colorBy === c
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Calendar mode"
            className="inline-flex rounded-lg border bg-muted/50 p-0.5"
          >
            {CAL_MODES.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === m
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={() => onCreate(anchor)}>
            <Plus className="size-4" />
            New task
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        {/* ---------- Grid ---------- */}
        <div>
          {mode === "month" && (
            <div
              className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-muted-foreground"
              aria-hidden="true"
            >
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>
          )}
          <div
            className={cn(
              "grid gap-px overflow-hidden rounded-2xl border bg-border",
              mode === "month" && "grid-cols-7",
              mode === "week" && "grid-cols-1 sm:grid-cols-7",
              mode === "day" && "grid-cols-1",
            )}
          >
            {days.map((date) => (
              <DayCell
                key={date}
                date={date}
                mode={mode}
                tasks={byDate.get(date) ?? []}
                inMonth={date.slice(0, 7) === monthKey}
                today={today}
                describe={describe}
                onOpen={onOpen}
                onCreate={onCreate}
                onZoom={zoomTo}
              />
            ))}
          </div>
        </div>

        {/* ---------- Unscheduled tray ---------- */}
        {unscheduled.length > 0 && (
          <section
            aria-label="Unscheduled tasks"
            className="rounded-2xl border border-dashed p-3"
          >
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Inbox className="size-3.5" aria-hidden="true" />
              Unscheduled ({unscheduled.length})
            </h3>
            <p className="mb-2 text-xs text-muted-foreground">
              Drag a task onto a day to give it a date.
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {unscheduled.map((task) => (
                <DraggableChip
                  key={task.id}
                  task={task}
                  info={describe(task)}
                  size="sm"
                  onOpen={onOpen}
                />
              ))}
            </div>
          </section>
        )}

        <DragOverlay>
          {activeTask ? (
            <ChipBody
              task={activeTask}
              info={describe(activeTask)}
              size="sm"
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
