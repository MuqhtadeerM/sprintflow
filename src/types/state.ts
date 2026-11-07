import type {
  Activity,
  Column,
  Dependency,
  Label,
  Project,
  Sprint,
  Task,
  User,
  Workspace,
} from "./index";

export interface DataState {
  workspaces: Workspace[];
  projects: Project[];
  sprints: Sprint[];
  columns: Column[];
  tasks: Task[];
  labels: Label[];
  users: User[];
  dependencies: Dependency[];
  activities: Activity[];
  currentUserId: string;
}
