import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ViewType = "board" | "gantt" | "calendar" | "list";
export type SyncStatus = "idle" | "saving" | "error";

interface CreateDialogState {
  open: boolean;
  columnId: string | null;
  dueDate: string | null;
}

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  activeTaskId: string | null;
  hydrated: boolean;
  syncStatus: SyncStatus;
  createDialog: CreateDialogState;
  historyLabels: { undo: string | null; redo: string | null };
  shortcutsOpen: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
  activeTaskId: null,
  hydrated: false,
  syncStatus: "idle",
  createDialog: { open: false, columnId: null, dueDate: null },
  historyLabels: { undo: null, redo: null },
  shortcutsOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setMobileNav(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
    openTask(state, action: PayloadAction<string>) {
      state.activeTaskId = action.payload;
    },
    closeTask(state) {
      state.activeTaskId = null;
    },
    setHydrated(state) {
      state.hydrated = true;
    },
    setSyncStatus(state, action: PayloadAction<SyncStatus>) {
      state.syncStatus = action.payload;
    },
    openCreateTask(
      state,
      action: PayloadAction<
        { columnId?: string; dueDate?: string } | undefined
      >,
    ) {
      state.createDialog = {
        open: true,
        columnId: action.payload?.columnId ?? null,
        dueDate: action.payload?.dueDate ?? null,
      };
    },
    closeCreateTask(state) {
      state.createDialog.open = false;
    },
    setHistoryLabels(
      state,
      action: PayloadAction<{ undo: string | null; redo: string | null }>,
    ) {
      state.historyLabels = action.payload;
    },
    setShortcutsOpen(state, action: PayloadAction<boolean>) {
      state.shortcutsOpen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setMobileNav,
  openTask,
  closeTask,
  setHydrated,
  setSyncStatus,
  openCreateTask,
  closeCreateTask,
  setHistoryLabels,
  setShortcutsOpen,
} = uiSlice.actions;
export default uiSlice.reducer;
