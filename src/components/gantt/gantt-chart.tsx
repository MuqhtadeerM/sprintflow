"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CalendarRange, Plus, Unlink, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DependencyLayer,
  type ArrowShape,
  type LinkLine,
} from "./dependency-layer";
import { GanttBar } from "./gantt-bar";
import { useFilters } from "@/hooks/use-filters";
import { useProjectTasks } from "@/hooks/use-project-tasks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addDependency,
  removeDependency,
  setTaskDates,
} from "@/store/slices/data-slice";
import { openCreateTask, openTask } from "@/store/slices/ui-slice";
import { shiftDate } from "@/lib/calendar-utils";
import { daysBetween, formatShort, todayStr } from "@/lib/date-utils";
import { wouldCreateCycle } from "@/lib/dependency-utils";
import { hasActiveFilters } from "@/lib/filter-utils";
import {
  BAR_H,
  GANTT_ZOOMS,
  PX_PER_DAY,
  ROW_H,
  applyDelta,
  arrowPath,
  buildSegments,
  computeRange,
  durationDays,
  isConflict,
  shiftAfter,
  spanOf,
  tiersFor,
  type BarDragMode,
  type GanttZoom,
  type Span,
} from "@/lib/gantt-utils";
import { PRIORITY_META } from "@/lib/task-meta";
import { isOverdue } from "@/lib/task-utils";
import { cn } from "@/lib/utils";
import type { Sprint, Task } from "@/types";

const HEADER_H = 56;
const DONE_COLOR = "#10b981";

type DragMode = BarDragMode | "link";

interface DragState {
  taskId: string;
  mode: DragMode;
  startX: number;
  base: Span;
  moved: boolean;
  pointerId: number;
}

interface LinkingState {
  fromId: string;
  x: number;
  y: number;
  hoverId: string | null;
}

function toMode(value: string | undefined): DragMode {
  return value === "start" || value === "end" || value === "link"
    ? value
    : "move";
}

function visibleWidth(
  scroller: HTMLElement | null,
  label: HTMLElement | null,
): number {
  return scroller && label ? scroller.clientWidth - label.offsetWidth : 0;
}

interface GanttChartProps {
  projectId: string;
  sprintId: string | null;
  sprint: Sprint | null;
}

export function GanttChart({ projectId, sprintId, sprint }: GanttChartProps) {
  const dispatch = useAppDispatch();
  const tasks = useProjectTasks(projectId, sprintId); // sprint + URL filters
  const columns = useAppSelector((s) => s.data.columns);
  const users = useAppSelector((s) => s.data.users);
  const dependencies = useAppSelector((s) => s.data.dependencies);
  const { filters, clearAll } = useFilters();
  const today = todayStr();

  const [zoom, setZoom] = useState<GanttZoom>("week");
  const [preview, setPreview] = useState<{ taskId: string; span: Span } | null>(
    null,
  );
  const [linking, setLinking] = useState<LinkingState | null>(null);
  const [selectedDepId, setSelectedDepId] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const centerRef = useRef<number | null>(null);
  const prevStartRef = useRef<string | null>(null);
  const didInit = useRef(false);

  const ppd = PX_PER_DAY[zoom];

  /* ---------- derived data ---------- */
  const columnById = useMemo(
    () => new Map(columns.map((c) => [c.id, c] as const)),
    [columns],
  );
  const userById = useMemo(
    () => new Map(users.map((u) => [u.id, u] as const)),
    [users],
  );
  const taskById = useMemo(
    () => new Map(tasks.map((t) => [t.id, t] as const)),
    [tasks],
  );

  // Sorted by column, not by date, so rows don't jump while you drag bars.
  const rows = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          (columnById.get(a.columnId)?.order ?? 0) -
            (columnById.get(b.columnId)?.order ?? 0) || a.order - b.order,
      ),
    [tasks, columnById],
  );
  const rowIndex = useMemo(
    () => new Map(rows.map((t, i) => [t.id, i] as const)),
    [rows],
  );

  const spans = useMemo(() => {
    const map = new Map<string, Span>();
    for (const t of rows) {
      const s = spanOf(t);
      if (s) map.set(t.id, s);
    }
    return map;
  }, [rows]);

  // The range ignores the drag preview, so the origin never moves mid-drag.
  const range = useMemo(
    () => computeRange([...spans.values()], today),
    [spans, today],
  );
  const totalWidth = range.days * ppd;
  const bodyHeight = rows.length * ROW_H;

  const tiers = tiersFor(zoom);
  const topSegments = useMemo(
    () => buildSegments(range.start, range.days, ppd, tiers.top, true),
    [range.start, range.days, ppd, tiers.top],
  );
  const bottomSegments = useMemo(
    () => buildSegments(range.start, range.days, ppd, tiers.bottom),
    [range.start, range.days, ppd, tiers.bottom],
  );

  const todayIdx = daysBetween(range.start, today);
  const todayX = (todayIdx + 0.5) * ppd;

  const spanFor = useCallback(
    (id: string): Span | undefined =>
      preview && preview.taskId === id ? preview.span : spans.get(id),
    [preview, spans],
  );

  const arrows = useMemo<ArrowShape[]>(() => {
    const out: ArrowShape[] = [];
    for (const dep of dependencies) {
      const pi = rowIndex.get(dep.predecessorId);
      const si = rowIndex.get(dep.successorId);
      const a = spanFor(dep.predecessorId);
      const b = spanFor(dep.successorId);
      if (pi === undefined || si === undefined || !a || !b) continue; // one end is hidden
      const x1 = (daysBetween(range.start, a.end) + 1) * ppd;
      const x2 = daysBetween(range.start, b.start) * ppd;
      out.push({
        id: dep.id,
        d: arrowPath(
          x1,
          pi * ROW_H + ROW_H / 2,
          x2,
          si * ROW_H + ROW_H / 2,
          ROW_H,
        ),
        conflict: isConflict(a, b),
        selected: dep.id === selectedDepId,
      });
    }
    return out;
  }, [dependencies, rowIndex, spanFor, range.start, ppd, selectedDepId]);

  const conflictCount = arrows.filter((a) => a.conflict).length;
  const selectedDep = dependencies.find((d) => d.id === selectedDepId) ?? null;

  const linkLine = useMemo<LinkLine | null>(() => {
    if (!linking) return null;
    const from = spanFor(linking.fromId);
    const row = rowIndex.get(linking.fromId);
    if (!from || row === undefined) return null;
    return {
      x1: (daysBetween(range.start, from.end) + 1) * ppd,
      y1: row * ROW_H + ROW_H / 2,
      x2: linking.x,
      y2: linking.y,
    };
  }, [linking, spanFor, rowIndex, range.start, ppd]);

  const unscheduledCount = rows.length - spans.size;

  /* ---------- scrolling ---------- */
  const scrollToToday = useCallback(
    (behavior: ScrollBehavior) => {
      const el = scrollerRef.current;
      if (!el) return;
      const left = todayIdx * ppd - visibleWidth(el, labelRef.current) / 3;
      el.scrollTo({ left: Math.max(0, left), behavior });
    },
    [todayIdx, ppd],
  );

  // First paint: show today (with a little past on the left).
  useLayoutEffect(() => {
    if (didInit.current || !scrollerRef.current) return;
    didInit.current = true;
    scrollToToday("auto");
  }, [scrollToToday]);

  // The origin moved (a task left the padded range): compensate so nothing jumps.
  useLayoutEffect(() => {
    const prev = prevStartRef.current;
    prevStartRef.current = range.start;
    const el = scrollerRef.current;
    if (prev && prev !== range.start && el) {
      el.scrollLeft += daysBetween(range.start, prev) * ppd;
    }
  }, [range.start, ppd]);

  // After zooming, keep the same date in the middle of the screen.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (centerRef.current === null || !el) return;
    const half = visibleWidth(el, labelRef.current) / 2;
    el.scrollLeft = Math.max(0, centerRef.current * ppd - half);
    centerRef.current = null;
  }, [zoom, ppd]);

  const changeZoom = (next: GanttZoom) => {
    if (next === zoom) return;
    const el = scrollerRef.current;
    if (el) {
      const half = visibleWidth(el, labelRef.current) / 2;
      centerRef.current = (el.scrollLeft + half) / ppd;
    }
    setZoom(next);
  };

  /* ---------- actions ---------- */
  const commitSpan = (task: Task, next: Span, withToast: boolean) => {
    const previous = { startDate: task.startDate, dueDate: task.dueDate };
    dispatch(
      setTaskDates({ id: task.id, startDate: next.start, dueDate: next.end }),
    );
    if (!withToast) return;
    toast.success(
      `Rescheduled to ${formatShort(next.start)} – ${formatShort(next.end)}`,
      {
        description: task.title,
        action: {
          label: "Undo",
          onClick: () => dispatch(setTaskDates({ id: task.id, ...previous })),
        },
      },
    );
  };

  const createLink = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    if (
      dependencies.some(
        (d) => d.predecessorId === fromId && d.successorId === toId,
      )
    ) {
      toast.info("Those tasks are already linked");
      return;
    }
    if (wouldCreateCycle(dependencies, fromId, toId)) {
      toast.error("That would create a loop", {
        description:
          "A task can't wait on another task that (directly or indirectly) waits on it.",
      });
      return;
    }
    dispatch(addDependency(fromId, toId));
    const pred = spans.get(fromId);
    const succ = spans.get(toId);
    const succTask = taskById.get(toId);
    if (pred && succ && succTask && isConflict(pred, succ)) {
      const fix = shiftAfter(pred, succ);
      toast.warning("Linked, but the schedule conflicts", {
        description: `“${succTask.title}” starts before the task it depends on finishes.`,
        action: {
          label: "Shift it",
          onClick: () => commitSpan(succTask, fix, false),
        },
      });
    } else {
      toast.success("Tasks linked");
    }
  };

  /* ---------- pointer handling (one gesture handles move, resize and link) ---------- */
  const handleDown = (
    e: React.PointerEvent<HTMLDivElement>,
    task: Task,
    span: Span,
  ) => {
    if (e.button !== 0) return;
    const handle = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-handle]",
    );
    const mode = toMode(handle?.dataset.handle);
    e.currentTarget.setPointerCapture(e.pointerId); // all later events come to this bar
    dragRef.current = {
      taskId: task.id,
      mode,
      startX: e.clientX,
      base: span,
      moved: false,
      pointerId: e.pointerId,
    };
    if (mode === "link") {
      const rect = timelineRef.current?.getBoundingClientRect();
      setLinking({
        fromId: task.id,
        x: rect ? e.clientX - rect.left : 0,
        y: rect ? e.clientY - rect.top : 0,
        hoverId: null,
      });
    }
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;

    if (d.mode === "link") {
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;
      const under = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-task-id]");
      const hoverId =
        under?.dataset.taskId && under.dataset.taskId !== d.taskId
          ? under.dataset.taskId
          : null;
      setLinking({
        fromId: d.taskId,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        hoverId,
      });
      return;
    }

    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) d.moved = true; // under 3px it's a click, not a drag
    if (!d.moved) return;
    const next = applyDelta(d.base, d.mode, Math.round(dx / ppd));
    setPreview((prev) =>
      prev &&
      prev.taskId === d.taskId &&
      prev.span.start === next.start &&
      prev.span.end === next.end
        ? prev
        : { taskId: d.taskId, span: next },
    );
  };

  const handleUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;

    if (d.mode === "link") {
      const under = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-task-id]");
      setLinking(null);
      if (under?.dataset.taskId) createLink(d.taskId, under.dataset.taskId);
      return;
    }

    setPreview(null);
    const task = taskById.get(d.taskId);
    if (!task) return;
    if (!d.moved) {
      dispatch(openTask(task.id)); // a click opens the drawer
      return;
    }
    // Recomputed from the pointer, not from state: always matches where you let go.
    const next = applyDelta(
      d.base,
      d.mode,
      Math.round((e.clientX - d.startX) / ppd),
    );
    if (next.start !== d.base.start || next.end !== d.base.end)
      commitSpan(task, next, true);
  };

  const handleCancel = () => {
    dragRef.current = null;
    setPreview(null);
    setLinking(null);
  };

  const handleKey = (
    e: React.KeyboardEvent<HTMLDivElement>,
    task: Task,
    span: Span,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dispatch(openTask(task.id));
      return;
    }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" ? 1 : -1;
    commitSpan(
      task,
      applyDelta(span, e.shiftKey ? "end" : "move", delta),
      false,
    );
  };

  /* ---------- render ---------- */
  if (rows.length === 0) {
    const filtered = hasActiveFilters(filters);
    return (
      <EmptyState
        icon={CalendarRange}
        title={filtered ? "No tasks match your filters" : "Nothing to plan yet"}
        description={
          filtered
            ? "Try removing a filter, or clear them all to see every task."
            : "Create a task and it will appear here as a bar on the timeline."
        }
        action={
          filtered ? (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <X className="size-4" />
              Clear all filters
            </Button>
          ) : (
            <Button size="sm" onClick={() => dispatch(openCreateTask())}>
              <Plus className="size-4" />
              New task
            </Button>
          )
        }
      />
    );
  }

  const selectedPred = selectedDep
    ? taskById.get(selectedDep.predecessorId)
    : undefined;
  const selectedSucc = selectedDep
    ? taskById.get(selectedDep.successorId)
    : undefined;
  const sprintBand =
    sprint && sprintId !== "all"
      ? {
          left: daysBetween(range.start, sprint.startDate) * ppd,
          width: (daysBetween(sprint.startDate, sprint.endDate) + 1) * ppd,
        }
      : null;

  return (
    <div className="space-y-3">
      {/* ---------- Toolbar ---------- */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Zoom"
          className="inline-flex rounded-lg border bg-muted/50 p-0.5"
        >
          {GANTT_ZOOMS.map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={zoom === z}
              onClick={() => changeZoom(z)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring",
                zoom === z
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {z}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrollToToday("smooth")}
        >
          Today
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {conflictCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400">
              <AlertTriangle className="size-3.5" aria-hidden="true" />
              {conflictCount} schedule conflict{conflictCount === 1 ? "" : "s"}
            </span>
          )}
          {unscheduledCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unscheduledCount} without dates
            </span>
          )}
          <Button size="sm" onClick={() => dispatch(openCreateTask())}>
            <Plus className="size-4" />
            New task
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag a bar to reschedule it, drag its edges to resize, or drag the dot
        on its right edge onto another bar to link them. Click an arrow to
        select it.
      </p>

      {selectedDep && selectedPred && selectedSucc && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm"
        >
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{selectedPred.title}</span>
            <span className="text-muted-foreground"> must finish before </span>
            <span className="font-medium">{selectedSucc.title}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 dark:text-red-400"
            onClick={() => {
              dispatch(removeDependency(selectedDep.id));
              setSelectedDepId(null);
              toast.success("Link removed");
            }}
          >
            <Unlink className="size-4" />
            Remove link
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss"
            onClick={() => setSelectedDepId(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* ---------- Chart ---------- */}
      <div
        ref={scrollerRef}
        role="region"
        aria-label="Gantt chart"
        tabIndex={0}
        className="relative max-h-[70vh] overflow-auto rounded-2xl border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          style={{ width: totalWidth }}
          className="relative flex min-w-full flex-col"
        >
          {/* Header */}
          <div
            className="sticky top-0 z-30 flex border-b bg-card"
            style={{ height: HEADER_H }}
          >
            <div className="sticky left-0 z-40 flex w-36 shrink-0 items-end border-r bg-card px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:w-60">
              Task · {rows.length}
            </div>
            <div className="relative shrink-0" style={{ width: totalWidth }}>
              <div
                className="relative border-b"
                style={{ height: HEADER_H / 2 }}
              >
                {topSegments.map((s) => (
                  <div
                    key={s.key}
                    className="absolute inset-y-0 truncate border-l px-2 py-1.5 text-xs font-semibold"
                    style={{ left: s.left, width: s.width }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
              <div className="relative" style={{ height: HEADER_H / 2 }}>
                {bottomSegments.map((s) => (
                  <div
                    key={s.key}
                    className={cn(
                      "absolute inset-y-0 truncate border-l px-1 py-1.5 text-[11px] text-muted-foreground",
                      zoom === "day" && "text-center",
                      s.weekend && "bg-muted/50",
                    )}
                    style={{ left: s.left, width: s.width }}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
              <span
                className="pointer-events-none absolute bottom-0.5 z-10 -translate-x-1/2 rounded bg-red-500 px-1.5 text-[10px] font-semibold leading-4 text-white"
                style={{ left: todayX }}
              >
                Today
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="flex">
            {/* Sticky task names */}
            <div
              ref={labelRef}
              className="sticky left-0 z-20 w-36 shrink-0 border-r bg-card md:w-60"
            >
              {rows.map((task) => {
                const span = spanFor(task.id);
                const column = columnById.get(task.columnId);
                const assignee = task.assigneeId
                  ? userById.get(task.assigneeId)
                  : undefined;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 border-b px-3"
                    style={{ height: ROW_H }}
                  >
                    <button
                      type="button"
                      onClick={() => dispatch(openTask(task.id))}
                      className="min-w-0 flex-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span
                        className={cn(
                          "block truncate text-sm font-medium",
                          column?.statusKey === "done" &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="block truncate text-[11px] tabular-nums text-muted-foreground">
                        {span
                          ? `${formatShort(span.start)} – ${formatShort(span.end)} · ${durationDays(span)}d`
                          : "No dates yet"}
                      </span>
                    </button>
                    {assignee && (
                      <span className="hidden md:block" title={assignee.name}>
                        <UserAvatar user={assignee} size={20} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Timeline: isolate keeps it under the sticky names; overflow-hidden clips bars to the chart */}
            <div
              ref={timelineRef}
              className="relative isolate shrink-0 overflow-hidden"
              style={{ width: totalWidth, height: bodyHeight }}
            >
              {/* Grid lines and weekend shading */}
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden="true"
              >
                {sprintBand && (
                  <div
                    className="absolute inset-y-0 border-x border-primary/25 bg-primary/[0.04]"
                    style={{ left: sprintBand.left, width: sprintBand.width }}
                  />
                )}
                {bottomSegments.map((s) => (
                  <div
                    key={s.key}
                    className={cn(
                      "absolute inset-y-0 border-l border-border/60",
                      s.weekend && "bg-muted/40",
                    )}
                    style={{ left: s.left, width: s.width }}
                  />
                ))}
              </div>

              {/* Today line */}
              <div
                className="pointer-events-none absolute inset-y-0 z-[15] w-px bg-red-500/80"
                style={{ left: todayX }}
                aria-hidden="true"
              />

              <DependencyLayer
                width={totalWidth}
                height={bodyHeight}
                arrows={arrows}
                linkLine={linkLine}
                onSelect={setSelectedDepId}
              />

              {rows.map((task) => {
                const span = spanFor(task.id);
                const column = columnById.get(task.columnId);
                const done = column?.statusKey === "done";

                // Clamp the bar to the chart area
                let barLeft = 0;
                let barWidth = ppd;
                if (span) {
                  const rawLeft = daysBetween(range.start, span.start) * ppd;
                  const rawRight = rawLeft + durationDays(span) * ppd;
                  barLeft = Math.max(0, rawLeft);
                  barWidth = Math.max(
                    ppd,
                    Math.min(rawRight, totalWidth) - barLeft,
                  );
                }

                return (
                  <div
                    key={task.id}
                    className="relative border-b"
                    style={{ height: ROW_H }}
                  >
                    {span ? (
                      <GanttBar
                        task={task}
                        span={span}
                        left={barLeft}
                        width={barWidth}
                        color={
                          done ? DONE_COLOR : PRIORITY_META[task.priority].color
                        }
                        done={done}
                        overdue={isOverdue(task, columns, today)}
                        assignee={
                          task.assigneeId
                            ? userById.get(task.assigneeId)
                            : undefined
                        }
                        dragging={
                          preview?.taskId === task.id ||
                          linking?.fromId === task.id
                        }
                        linkTarget={linking?.hoverId === task.id}
                        onPointerDown={(e) => handleDown(e, task, span)}
                        onPointerMove={handleMove}
                        onPointerUp={handleUp}
                        onPointerCancel={handleCancel}
                        onKeyDown={(e) => handleKey(e, task, span)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            setTaskDates({
                              id: task.id,
                              startDate: today,
                              dueDate: shiftDate(today, 2),
                            }),
                          )
                        }
                        className="absolute z-20 rounded-lg border border-dashed px-2.5 text-xs text-muted-foreground outline-none transition-colors hover:border-primary/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        style={{
                          left: Math.max(4, todayIdx * ppd),
                          top: (ROW_H - BAR_H) / 2,
                          height: BAR_H,
                        }}
                      >
                        + Schedule
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
