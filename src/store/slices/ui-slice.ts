import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ViewType = "board" | "gantt" | "calendar" | "list";
export type SyncStatus = "idle" | "saving" | "error";

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  activeTaskId: string | null;
  hydrated: boolean;
  syncStatus: SyncStatus;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
  activeTaskId: null,
  hydrated: false,
  syncStatus: "idle",
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
  },
});

export const {
  toggleSidebar,
  setMobileNav,
  openTask,
  closeTask,
  setHydrated,
  setSyncStatus,
} = uiSlice.actions;
export default uiSlice.reducer;
