import { createAction } from "@reduxjs/toolkit";

export const undoAction = createAction("history/undo");
export const redoAction = createAction("history/redo");
