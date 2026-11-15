"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useHistoryActions } from "./use-history-actions";
import { useAppDispatch } from "@/store/hooks";
import { openCreateTask, setShortcutsOpen } from "@/store/slices/ui-slice";

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

const dialogOpen = (): boolean =>
  document.querySelector('[role="dialog"], [role="alertdialog"]') !== null;

function focusSearch() {
  const el = document.getElementById("global-search");
  if (el instanceof HTMLInputElement) {
    el.focus();
    el.select();
  } else {
    toast.info("Search is available inside a project");
  }
}

export function useKeyboardShortcuts() {
  const dispatch = useAppDispatch();
  const { undo, redo } = useHistoryActions();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;

      // Undo / redo: Ctrl or Cmd + Z, + Shift + Z, or Ctrl + Y
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key !== "z" && key !== "y") return;
        if (isEditable(e.target)) return; // let text fields keep their own undo
        e.preventDefault();
        if (key === "y" || e.shiftKey) redo();
        else undo();
        return;
      }

      // Single-key shortcuts: never while typing or while a dialog is open
      if (e.altKey || e.repeat || isEditable(e.target) || dialogOpen()) return;

      switch (e.key) {
        case "c":
        case "C":
          e.preventDefault();
          dispatch(openCreateTask());
          break;
        case "f":
        case "F":
        case "/":
          e.preventDefault(); // otherwise the key would be typed into the search box
          focusSearch();
          break;
        case "?":
          e.preventDefault();
          dispatch(setShortcutsOpen(true));
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch, undo, redo]);
}
