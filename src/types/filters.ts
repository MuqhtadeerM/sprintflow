import type { Priority, StatusKey } from "./task";

export interface FilterState {
  search: string;
  assigneeIds: string[]; // may include "unassigned"
  labelIds: string[];
  priorities: Priority[];
  statuses: StatusKey[];
  dateFrom: string | null; // "yyyy-MM-dd"
  dateTo: string | null;
  overdueOnly: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  assigneeIds: [],
  labelIds: [],
  priorities: [],
  statuses: [],
  dateFrom: null,
  dateTo: null,
  overdueOnly: false,
};
