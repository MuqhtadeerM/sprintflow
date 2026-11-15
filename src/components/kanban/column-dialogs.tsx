"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/shared/native-select";
import { useAppDispatch } from "@/store/hooks";
import {
  deleteColumn,
  setColumnStatus,
  setWipLimit,
} from "@/store/slices/data-slice";
import { STATUS_META } from "@/lib/task-meta";
import type { Column, StatusKey } from "@/types";

const STATUS_KEYS = Object.keys(STATUS_META) as StatusKey[];
const DELETE_ALL = "__delete__";

/* ---------------- Settings ---------------- */

function SettingsForm({
  column,
  count,
  onDone,
}: {
  column: Column;
  count: number;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch();
  const [limit, setLimit] = useState(
    column.wipLimit === null ? "" : String(column.wipLimit),
  );
  const [status, setStatus] = useState<StatusKey>(column.statusKey);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let next: number | null = null;
    if (limit.trim() !== "") {
      const n = Number(limit);
      if (!Number.isInteger(n) || n < 1 || n > 99)
        return setError(
          "Enter a whole number from 1 to 99, or leave empty for no limit.",
        );
      next = n;
    }
    dispatch(setWipLimit({ id: column.id, wipLimit: next }));
    dispatch(setColumnStatus({ id: column.id, statusKey: status }));
    if (next !== null && count > next) {
      toast.warning(`“${column.name}” is over its new limit`, {
        description: `It holds ${count} tasks. Nothing is removed, but no more can be added.`,
      });
    } else {
      toast.success("Column updated");
    }
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="wip-limit" className="text-sm font-medium">
          WIP limit
        </label>
        <Input
          id="wip-limit"
          inputMode="numeric"
          autoFocus
          value={limit}
          placeholder="No limit"
          aria-invalid={error !== null}
          onChange={(e) => {
            setLimit(e.target.value);
            setError(null);
          }}
        />
        <p className="text-xs text-muted-foreground">
          The most tasks this column can hold at once. It currently holds{" "}
          {count}.
        </p>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
      <label className="block space-y-1.5 text-sm font-medium">
        Counts as
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusKey)}
        >
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </NativeSelect>
        <span className="block text-xs font-normal text-muted-foreground">
          Decides how tasks here appear in the stats, filters and charts.
        </span>
      </label>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
}

export function ColumnSettingsDialog({
  column,
  count,
  open,
  onOpenChange,
}: {
  column: Column;
  count: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{column.name} settings</DialogTitle>
          <DialogDescription>
            Work-in-progress limit and status mapping.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <SettingsForm
            column={column}
            count={count}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Delete ---------------- */

function DeleteForm({
  column,
  others,
  counts,
  onDone,
}: {
  column: Column;
  others: Column[];
  counts: Map<string, number>;
  onDone: () => void;
}) {
  const dispatch = useAppDispatch();
  const taskCount = counts.get(column.id) ?? 0;
  const [target, setTarget] = useState<string>(others[0]?.id ?? DELETE_ALL);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    let moveTo: string | null = null;
    if (taskCount > 0 && target !== DELETE_ALL) {
      const dest = others.find((c) => c.id === target);
      if (!dest) return setError("Choose where the tasks should go.");
      if (
        dest.wipLimit !== null &&
        (counts.get(dest.id) ?? 0) + taskCount > dest.wipLimit
      ) {
        return setError(
          `“${dest.name}” can't take ${taskCount} more (limit ${dest.wipLimit}). Pick another column.`,
        );
      }
      moveTo = dest.id;
    }
    dispatch(deleteColumn({ columnId: column.id, moveToColumnId: moveTo }));
    toast.success(`Column “${column.name}” deleted`);
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {taskCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          This column is empty, so nothing else is affected.
        </p>
      ) : (
        <label className="block space-y-1.5 text-sm font-medium">
          What should happen to its {taskCount} task{taskCount === 1 ? "" : "s"}
          ?
          <NativeSelect
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setError(null);
            }}
          >
            {others.map((c) => (
              <option key={c.id} value={c.id}>
                Move to “{c.name}”
              </option>
            ))}
            <option value={DELETE_ALL}>Delete the tasks too</option>
          </NativeSelect>
        </label>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive">
          {taskCount > 0 && target === DELETE_ALL
            ? "Delete column and tasks"
            : "Delete column"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DeleteColumnDialog({
  column,
  others,
  counts,
  open,
  onOpenChange,
}: {
  column: Column;
  others: Column[];
  counts: Map<string, number>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete “{column.name}”?</DialogTitle>
          <DialogDescription>
            Choose what happens to the tasks inside it.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <DeleteForm
            column={column}
            others={others}
            counts={counts}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
