export type Priority = "low" | "medium" | "high" | "urgent";

/** Fixed set of status categories. Each column maps to exactly one. */
export type StatusKey = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface Label {
  id: string;
  name: string;
  color: string; // hex
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string; // ISO
}

export interface Attachment {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string; // ISO
}

export interface Dependency {
  id: string;
  /** The task that must finish first. */
  predecessorId: string;
  /** The task that waits. */
  successorId: string;
}

export type ActivityType =
  | "created"
  | "updated"
  | "moved"
  | "commented"
  | "deleted"
  | "dates_changed";

export interface Activity {
  id: string;
  taskId: string;
  actorId: string;
  type: ActivityType;
  message: string;
  createdAt: string; // ISO
}

export interface Task {
  id: string;
  projectId: string;
  sprintId: string;
  title: string;
  description: string; // Markdown
  columnId: string;
  priority: Priority;
  assigneeId: string | null;
  labelIds: string[];
  startDate: string | null; // "yyyy-MM-dd"
  dueDate: string | null; // "yyyy-MM-dd"
  estimatedHours: number;
  progress: number; // 0-100
  checklist: ChecklistItem[];
  comments: Comment[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  order: number; // position inside its column
}
