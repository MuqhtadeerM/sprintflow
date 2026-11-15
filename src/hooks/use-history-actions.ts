"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { redoAction, undoAction } from "@/store/history-actions";
import { useAppDispatch, useAppStore } from "@/store/hooks";

/** Stable undo/redo callbacks with feedback toasts. Doesn't subscribe to state. */
export function useHistoryActions() {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const undo = useCallback(() => {
    const label = store.getState().ui.historyLabels.undo;
    if (!label) return;
    dispatch(undoAction());
    toast(`Undid: ${label}`, {
      action: { label: "Redo", onClick: () => dispatch(redoAction()) },
    });
  }, [dispatch, store]);

  const redo = useCallback(() => {
    const label = store.getState().ui.historyLabels.redo;
    if (!label) return;
    dispatch(redoAction());
    toast(`Redid: ${label}`, {
      action: { label: "Undo", onClick: () => dispatch(undoAction()) },
    });
  }, [dispatch, store]);

  return { undo, redo };
}
