"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./index";
import { loadData } from "./persistence";
import { hydrateData } from "./slices/data-slice";
import { setHydrated } from "./slices/ui-slice";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer: runs once per mount, not on every render.
  const [store] = useState<AppStore>(() => makeStore());

  useEffect(() => {
    const saved = loadData();
    if (saved) store.dispatch(hydrateData(saved));
    store.dispatch(setHydrated());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
