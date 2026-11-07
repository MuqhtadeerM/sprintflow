import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import { createInitialData } from "@/data/mock-data";
import type { ActivityType, Column, DataState, Task } from "@/types";

const initialState: DataState = createInitialData();

const nowIso = () => new Date().toISOString();

/** Tasks in a column, sorted by their position. */
function tasksInColumn(state: DataState, columnId: string): Task[] {
  return state.tasks
    .filter((t) => t.columnId === columnId)
    .sort((a, b) => a.order - b.order);
}

/** Rewrites order = 0,1,2,... so there are never gaps or duplicates. */
function renumber(list: Task[]) {
  list.forEach((t, i) => {
    t.order = i;
  });
}

function log(
  state: DataState,
  taskId: string,
  type: ActivityType,
  message: string,
) {
  state.activities.unshift({
    id: nanoid(),
    taskId,
    actorId: state.currentUserId,
    type,
    message,
    createdAt: nowIso(),
  });
  if (state.activities.length > 200) state.activities.length = 200;
}

/** Would adding predecessor -> successor create a loop (A needs B needs A)? */
function createsCycle(
  state: DataState,
  predecessorId: string,
  successorId: string,
): boolean {
  // Walk forward from the successor; if we ever reach the predecessor, it's a cycle.
  const stack = [successorId];
  const seen = new Set<string>();
  while (stack.length) {
    const current = stack.pop() as string;
    if (current === predecessorId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const dep of state.dependencies) {
      if (dep.predecessorId === current) stack.push(dep.successorId);
    }
  }
  return false;
}

type NewTaskInput = Pick<
  Task,
  "projectId" | "sprintId" | "title" | "columnId"
> &
  Partial<Omit<Task, "id" | "projectId" | "sprintId" | "title" | "columnId">>;

type TaskChanges = Partial<Omit<Task, "id" | "projectId" | "createdAt">>;

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    /* ---------- lifecycle ---------- */
    hydrateData(_state, action: PayloadAction<DataState>) {
      return action.payload; // replace everything with the saved copy
    },
    resetData() {
      return createInitialData();
    },

    /* ---------- tasks ---------- */
    addTask: {
      // `prepare` runs BEFORE the reducer. Random IDs must be created here
      // because reducers have to be predictable.
      prepare(input: NewTaskInput) {
        const stamp = nowIso();
        const task: Task = {
          description: "",
          priority: "medium",
          assigneeId: null,
          labelIds: [],
          startDate: null,
          dueDate: null,
          estimatedHours: 0,
          progress: 0,
          checklist: [],
          comments: [],
          attachments: [],
          order: 0,
          ...input,
          id: nanoid(),
          createdAt: stamp,
          updatedAt: stamp,
        };
        return { payload: task };
      },
      reducer(state, action: PayloadAction<Task>) {
        const task = action.payload;
        const siblings = tasksInColumn(state, task.columnId);
        task.order = siblings.length; // put it at the bottom of its column
        state.tasks.push(task);
        log(state, task.id, "created", `Created "${task.title}"`);
      },
    },

    updateTask(
      state,
      action: PayloadAction<{ id: string; changes: TaskChanges }>,
    ) {
      const task = state.tasks.find((t) => t.id === action.payload.id);
      if (!task) return;
      Object.assign(task, action.payload.changes, { updatedAt: nowIso() });
      log(state, task.id, "updated", `Updated "${task.title}"`);
    },

    deleteTask(state, action: PayloadAction<string>) {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (!task) return;
      const columnId = task.columnId;
      state.tasks = state.tasks.filter((t) => t.id !== task.id);
      state.dependencies = state.dependencies.filter(
        (dep) => dep.predecessorId !== task.id && dep.successorId !== task.id,
      );
      renumber(tasksInColumn(state, columnId));
      log(state, task.id, "deleted", `Deleted "${task.title}"`);
    },

    duplicateTask: {
      prepare(taskId: string) {
        return { payload: { taskId, newId: nanoid() } };
      },
      reducer(state, action: PayloadAction<{ taskId: string; newId: string }>) {
        const source = state.tasks.find((t) => t.id === action.payload.taskId);
        if (!source) return;
        const stamp = nowIso();
        const copy: Task = {
          ...structuredClone(source),
          id: action.payload.newId,
          title: `${source.title} (copy)`,
          comments: [],
          createdAt: stamp,
          updatedAt: stamp,
          order: tasksInColumn(state, source.columnId).length,
        };
        state.tasks.push(copy);
        log(state, copy.id, "created", `Duplicated "${source.title}"`);
      },
    },

    /** Used by Kanban drag-and-drop AND by the status dropdowns. */
    moveTask(
      state,
      action: PayloadAction<{
        taskId: string;
        toColumnId: string;
        toIndex: number;
      }>,
    ) {
      const { taskId, toColumnId, toIndex } = action.payload;
      const task = state.tasks.find((t) => t.id === taskId);
      const target = state.columns.find((c) => c.id === toColumnId);
      if (!task || !target) return;

      const fromColumnId = task.columnId;
      const targetList = tasksInColumn(state, toColumnId).filter(
        (t) => t.id !== taskId,
      );

      // WIP guard: only blocks moves INTO a different, already-full column.
      if (
        fromColumnId !== toColumnId &&
        target.wipLimit !== null &&
        targetList.length >= target.wipLimit
      ) {
        return;
      }

      const index = Math.max(0, Math.min(toIndex, targetList.length));
      task.columnId = toColumnId;
      task.updatedAt = nowIso();
      targetList.splice(index, 0, task);
      renumber(targetList);

      if (fromColumnId !== toColumnId) {
        renumber(tasksInColumn(state, fromColumnId));
        // Keep progress sensible when a card lands in Done.
        if (target.statusKey === "done") task.progress = 100;
        log(state, taskId, "moved", `Moved "${task.title}" to ${target.name}`);
      }
    },

    /** Used by Gantt (drag/resize) and Calendar (drag to another day). */
    setTaskDates(
      state,
      action: PayloadAction<{
        id: string;
        startDate: string | null;
        dueDate: string | null;
      }>,
    ) {
      const task = state.tasks.find((t) => t.id === action.payload.id);
      if (!task) return;
      task.startDate = action.payload.startDate;
      task.dueDate = action.payload.dueDate;
      task.updatedAt = nowIso();
      log(state, task.id, "dates_changed", `Rescheduled "${task.title}"`);
    },

    /* ---------- comments ---------- */
    addComment: {
      prepare(taskId: string, authorId: string, body: string) {
        return {
          payload: {
            taskId,
            comment: { id: nanoid(), authorId, body, createdAt: nowIso() },
          },
        };
      },
      reducer(
        state,
        action: PayloadAction<{
          taskId: string;
          comment: {
            id: string;
            authorId: string;
            body: string;
            createdAt: string;
          };
        }>,
      ) {
        const task = state.tasks.find((t) => t.id === action.payload.taskId);
        if (!task) return;
        task.comments.push(action.payload.comment);
        log(state, task.id, "commented", `Commented on "${task.title}"`);
      },
    },

    /* ---------- bulk actions (for the List view) ---------- */
    bulkDeleteTasks(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload);
      state.tasks = state.tasks.filter((t) => !ids.has(t.id));
      state.dependencies = state.dependencies.filter(
        (dep) => !ids.has(dep.predecessorId) && !ids.has(dep.successorId),
      );
      state.columns.forEach((c) => renumber(tasksInColumn(state, c.id)));
    },
    bulkUpdateTasks(
      state,
      action: PayloadAction<{ ids: string[]; changes: TaskChanges }>,
    ) {
      const ids = new Set(action.payload.ids);
      state.tasks.forEach((t) => {
        if (ids.has(t.id))
          Object.assign(t, action.payload.changes, { updatedAt: nowIso() });
      });
    },

    /* ---------- columns ---------- */
    addColumn: {
      prepare(projectId: string, name: string) {
        return { payload: { projectId, name, id: nanoid() } };
      },
      reducer(
        state,
        action: PayloadAction<{ projectId: string; name: string; id: string }>,
      ) {
        const { projectId, name, id } = action.payload;
        const siblings = state.columns.filter((c) => c.projectId === projectId);
        const column: Column = {
          id,
          projectId,
          name,
          statusKey: "todo", // custom columns count as "todo" until you decide otherwise
          wipLimit: null,
          order: siblings.length,
        };
        state.columns.push(column);
      },
    },
    renameColumn(state, action: PayloadAction<{ id: string; name: string }>) {
      const column = state.columns.find((c) => c.id === action.payload.id);
      if (column) column.name = action.payload.name;
    },
    setWipLimit(
      state,
      action: PayloadAction<{ id: string; wipLimit: number | null }>,
    ) {
      const column = state.columns.find((c) => c.id === action.payload.id);
      if (column) column.wipLimit = action.payload.wipLimit;
    },
    /** moveToColumnId = where the tasks go; null = delete them with the column. */
    deleteColumn(
      state,
      action: PayloadAction<{
        columnId: string;
        moveToColumnId: string | null;
      }>,
    ) {
      const { columnId, moveToColumnId } = action.payload;
      const column = state.columns.find((c) => c.id === columnId);
      if (!column) return;
      const siblings = state.columns.filter(
        (c) => c.projectId === column.projectId,
      );
      if (siblings.length <= 1) return; // a board must keep at least one column

      const orphans = tasksInColumn(state, columnId);
      if (moveToColumnId) {
        const dest = tasksInColumn(state, moveToColumnId);
        orphans.forEach((t) => {
          t.columnId = moveToColumnId;
          dest.push(t);
        });
        renumber(dest);
      } else {
        const ids = new Set(orphans.map((t) => t.id));
        state.tasks = state.tasks.filter((t) => !ids.has(t.id));
        state.dependencies = state.dependencies.filter(
          (dep) => !ids.has(dep.predecessorId) && !ids.has(dep.successorId),
        );
      }
      state.columns = state.columns.filter((c) => c.id !== columnId);
      state.columns
        .filter((c) => c.projectId === column.projectId)
        .sort((a, b) => a.order - b.order)
        .forEach((c, i) => {
          c.order = i;
        });
    },

    /* ---------- dependencies ---------- */
    addDependency: {
      prepare(predecessorId: string, successorId: string) {
        return { payload: { id: nanoid(), predecessorId, successorId } };
      },
      reducer(
        state,
        action: PayloadAction<{
          id: string;
          predecessorId: string;
          successorId: string;
        }>,
      ) {
        const { predecessorId, successorId } = action.payload;
        if (predecessorId === successorId) return;
        const exists = state.dependencies.some(
          (d) =>
            d.predecessorId === predecessorId && d.successorId === successorId,
        );
        if (exists || createsCycle(state, predecessorId, successorId)) return;
        state.dependencies.push(action.payload);
      },
    },
    removeDependency(state, action: PayloadAction<string>) {
      state.dependencies = state.dependencies.filter(
        (d) => d.id !== action.payload,
      );
    },
  },
});

export const {
  hydrateData,
  resetData,
  addTask,
  updateTask,
  deleteTask,
  duplicateTask,
  moveTask,
  setTaskDates,
  addComment,
  bulkDeleteTasks,
  bulkUpdateTasks,
  addColumn,
  renameColumn,
  setWipLimit,
  deleteColumn,
  addDependency,
  removeDependency,
} = dataSlice.actions;

export default dataSlice.reducer;
