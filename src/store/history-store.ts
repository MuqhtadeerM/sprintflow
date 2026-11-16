import {
  isAction,
  type Middleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import {
  emptyHistory,
  lastLabel,
  recordStep,
  redoStep,
  undoStep,
  type History,
} from "@/lib/history-utils";
import type { DataState } from "@/types";
import { redoAction, undoAction } from "./history-actions";
import { hydrateData, restoreData, updateTask } from "./slices/data-slice";
import { setHistoryLabels } from "./slices/ui-slice";

const LABELS: Record<string, string> = {
  "data/addTask": "Create task",
  "data/deleteTask": "Delete task",
  "data/duplicateTask": "Duplicate task",
  "data/moveTask": "Move task",
  "data/setTaskDates": "Reschedule task",
  "data/addComment": "Add comment",
  "data/bulkDeleteTasks": "Delete tasks",
  "data/bulkUpdateTasks": "Update tasks",
  "data/addColumn": "Add column",
  "data/renameColumn": "Rename column",
  "data/setWipLimit": "Change WIP limit",
  "data/setColumnStatus": "Change column status",
  "data/deleteColumn": "Delete column",
  "data/addDependency": "Add dependency",
  "data/removeDependency": "Remove dependency",
  "data/addLabel": "Create label",
  "data/resetData": "Reset demo data",
  "data/renameWorkspace": "Rename workspace",
  "data/importData": "Import backup",
};

function labelFor(action: UnknownAction): string {
  if (updateTask.match(action) && action.payload.message)
    return action.payload.message;
  return LABELS[action.type] ?? "Change";
}

export function createHistoryMiddleware(): Middleware<
  object,
  { data: DataState }
> {
  return (api) => {
    let history: History<DataState> = emptyHistory();
    // True for the rest of the current tick after a change was recorded.
    let grouping = false;

    const publish = () =>
      api.dispatch(
        setHistoryLabels({
          undo: lastLabel(history.past),
          redo: lastLabel(history.future),
        }),
      );

    return (next) => (action) => {
      if (!isAction(action)) return next(action);

      if (undoAction.match(action) || redoAction.match(action)) {
        const step = undoAction.match(action) ? undoStep : redoStep;
        const result = step(history, api.getState().data);
        if (result) {
          history = result.history;
          api.dispatch(restoreData(result.restored));
          publish();
        }
        return action;
      }

      // Freshly loaded data starts a new timeline.
      if (hydrateData.match(action)) {
        const result = next(action);
        history = emptyHistory();
        publish();
        return result;
      }

      const before = api.getState().data;
      const result = next(action);
      const after = api.getState().data;

      const recordable =
        action.type.startsWith("data/") &&
        !restoreData.match(action) &&
        after !== before;
      if (!recordable) return result;

      if (!grouping) {
        history = recordStep(history, before, labelFor(action));
        grouping = true;
        queueMicrotask(() => {
          grouping = false;
        });
        publish();
      }
      // else: same tick, so it belongs to the entry already recorded
      return result;
    };
  };
}
