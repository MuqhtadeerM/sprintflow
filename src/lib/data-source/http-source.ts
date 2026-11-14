import type { ChangeSet, DataSource, RemoteData } from "./types";

export function createHttpSource(baseUrl: string): DataSource {
  return {
    async load() {
      const res = await fetch(`${baseUrl}/bootstrap`, { cache: "no-store" });
      if (res.status === 204) return null; // server is empty
      if (!res.ok) throw new Error(`Could not load data (${res.status})`);
      return (await res.json()) as RemoteData;
    },
    async apply(changes: ChangeSet[]) {
      const res = await fetch(`${baseUrl}/changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error(`Could not save changes (${res.status})`);
    },
  };
}
