import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./slices/ui-slice";
import dataReducer from "./slices/data-slice";
import { persistenceMiddleware } from "./persistence";

export const makeStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      data: dataReducer,
    },
    middleware: (getDefault) => getDefault().concat(persistenceMiddleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
