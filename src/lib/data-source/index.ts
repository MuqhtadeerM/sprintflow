import { createHttpSource } from "./http-source";
import { localSource } from "./local-source";
import type { DataSource } from "./types";

export function getDataSource(): DataSource {
  return process.env.NEXT_PUBLIC_DATA_SOURCE === "http"
    ? createHttpSource("/api")
    : localSource;
}
