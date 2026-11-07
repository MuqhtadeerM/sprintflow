import type { StatusKey } from "./task";

export interface Column {
  id: string;
  projectId: string;
  name: string;
  statusKey: StatusKey;
  wipLimit: number | null; // null = no limit
  order: number;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  startDate: string; // "yyyy-MM-dd"
  endDate: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string; // e.g. "WEB"
  description: string;
  color: string;
}

export interface Workspace {
  id: string;
  name: string;
}
