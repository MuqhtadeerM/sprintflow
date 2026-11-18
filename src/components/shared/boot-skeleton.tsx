import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the app loads its data. Mirrors the real layout, so nothing jumps. */
export function BootSkeleton() {
  return (
    <div
      className="flex h-screen overflow-hidden bg-background"
      aria-busy="true"
      aria-label="Loading SprintFlow"
    >
      <aside className="hidden w-64 shrink-0 space-y-3 border-r bg-card p-3 md:block">
        <Skeleton className="h-12 w-full rounded-lg" />
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="ml-auto size-8 rounded-full" />
        </div>
        <div className="space-y-6 p-6">
          <Skeleton className="h-7 w-56" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-72 w-72 shrink-0 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
