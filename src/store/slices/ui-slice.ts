import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ViewType = "board" | "gantt" | "calendar" | "list";

interface UiState {
  sidebarCollapsed: boolean;
  activeTaskId: string | null;
  hydrated: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  activeTaskId: null,
  hydrated: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
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
  },
});

export const { toggleSidebar, openTask, closeTask, setHydrated } =
  uiSlice.actions;
export default uiSlice.reducer;
