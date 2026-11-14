import { promises as fs } from "fs";
import path from "path";
import type { RemoteData } from "@/lib/data-source/types";

const FILE = path.join(process.cwd(), ".data", "db.json");

export async function readDb(): Promise<RemoteData | null> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as RemoteData;
  } catch {
    return null; // file doesn't exist yet
  }
}

export async function writeDb(data: RemoteData): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}

// Two requests at once could read the same file and overwrite each other.
// This queue runs them one at a time.
let chain: Promise<unknown> = Promise.resolve();
export function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}
