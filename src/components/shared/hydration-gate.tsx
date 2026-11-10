"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";

/** Shows a skeleton until saved data has been loaded from localStorage. */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const hydrated = useAppSelector((s) => s.ui.hydrated);

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  return <>{children}</>;
}
