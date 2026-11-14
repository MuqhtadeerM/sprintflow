import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/ui-slice";
import dataReducer from "./slices/data-slice";
import { createSyncMiddleware } from "./sync-middleware";
import type { DataSource } from "@/lib/data-source/types";

export const makeStore = (source: DataSource) =>
  configureStore({
    reducer: {
      ui: uiReducer,
      data: dataReducer,
    },
    middleware: (getDefault) =>
      getDefault().concat(createSyncMiddleware(source)),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
