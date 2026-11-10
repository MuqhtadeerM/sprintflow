import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ViewType = "board" | "gantt" | "calendar" | "list";

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  activeTaskId: string | null; // task shown in the drawer
  hydrated: boolean;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileNavOpen: false,
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
  },
});

export const { toggleSidebar, setMobileNav, openTask, closeTask, setHydrated } =
  uiSlice.actions;
export default uiSlice.reducer;
