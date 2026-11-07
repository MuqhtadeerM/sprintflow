"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./index";
import { loadData } from "./persistence";
import { hydrateData } from "./slices/data-slice";
import { setHydrated } from "./slices/ui-slice";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  const store = storeRef.current;

  useEffect(() => {
    const saved = loadData();
    if (saved) store.dispatch(hydrateData(saved));
    store.dispatch(setHydrated());
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
