"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { Button } from "@/components/ui/button";
import { getDataSource } from "@/lib/data-source";
import { bootstrap } from "./bootstrap";
import type { AppStore } from "./index";
import { BootSkeleton } from "@/components/shared/boot-skeleton";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<AppStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    bootstrap(getDataSource())
      .then((s) => {
        if (!cancelled) setStore(s);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Unknown error");
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (error) {
    return (
      <div
        role="alert"
        className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <h1 className="text-lg font-semibold">Couldn&apos;t load SprintFlow</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
        <Button
          onClick={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!store) {
    return <BootSkeleton />;
  }

  return <Provider store={store}>{children}</Provider>;
}
