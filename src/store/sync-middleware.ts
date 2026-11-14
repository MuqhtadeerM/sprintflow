import type { Middleware } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { diffState } from "@/lib/data-source/diff";
import type { ChangeSet, DataSource } from "@/lib/data-source/types";
import type { DataState } from "@/types";
import { hydrateData } from "./slices/data-slice";
import { setSyncStatus } from "./slices/ui-slice";

const DEBOUNCE_MS = 300;

export function createSyncMiddleware(
  source: DataSource,
): Middleware<object, { data: DataState }> {
  let pending: ChangeSet[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let inflight: Promise<void> = Promise.resolve();

  return (api) => {
    const flush = () => {
      const batch = pending;
      pending = [];
      if (batch.length === 0) return;

      api.dispatch(setSyncStatus("saving"));
      // Chained, so batches always reach the server in the order they happened.
      inflight = inflight
        .then(() => source.apply(batch))
        .then(() => {
          if (pending.length === 0) api.dispatch(setSyncStatus("idle"));
        })
        .catch(() => {
          pending = [...batch, ...pending]; // keep the unsaved changes
          api.dispatch(setSyncStatus("error"));
          toast.error("Couldn't save your changes", {
            description: "They are kept on screen and will be retried.",
            action: { label: "Retry", onClick: flush },
          });
        });
    };

    return (next) => (action) => {
      const before = api.getState().data;
      const result = next(action);

      // Loading data FROM the source must not be written back TO it.
      if (hydrateData.match(action)) return result;

      const after = api.getState().data;
      if (after === before) return result;

      pending.push(...diffState(before, after));
      clearTimeout(timer);
      timer = setTimeout(flush, DEBOUNCE_MS);
      return result;
    };
  };
}
