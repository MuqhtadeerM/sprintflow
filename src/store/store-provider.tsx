"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "./index";
import { loadData } from "./persistence";
import { hydrateData } from "./slices/data-slice";
import { setHydrated } from "./slices/ui-slice";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // null on the server and on the first client render. Effects never run
  // during prerender, so makeStore() is never called there.
  const [store, setStore] = useState<AppStore | null>(null);

  useEffect(() => {
    const newStore = makeStore();
    const saved = loadData();
    if (saved) newStore.dispatch(hydrateData(saved));
    newStore.dispatch(setHydrated());
    setStore(newStore);
  }, []);

  if (!store) {
    return (
      <div
        className="flex h-screen items-center justify-center bg-background text-sm text-muted-foreground"
        aria-busy="true"
      >
        Loading SprintFlow…
      </div>
    );
  }

  return <Provider store={store}>{children}</Provider>;
}
