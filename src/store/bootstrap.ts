import { createInitialData } from "@/data/mock-data";
import { diffState } from "@/lib/data-source/diff";
import { createEmptyData, type DataSource } from "@/lib/data-source/types";
import { makeStore, type AppStore } from "./index";
import { hydrateData } from "./slices/data-slice";
import { setHydrated } from "./slices/ui-slice";

/** Loads data (seeding the demo set on first run) and returns a ready store. */
export async function bootstrap(source: DataSource): Promise<AppStore> {
  let data = await source.load();

  if (!data) {
    // First run: write the demo set into the source so it is real, persistent data.
    const seed = createInitialData();
    await source.apply(diffState(createEmptyData(), seed));
    data = seed;
  }

  const store = makeStore(source);
  const currentUser =
    data.users.find((u) => u.role === "lead") ?? data.users[0];
  store.dispatch(
    hydrateData({ ...data, currentUserId: currentUser?.id ?? "" }),
  );
  store.dispatch(setHydrated());
  return store;
}
