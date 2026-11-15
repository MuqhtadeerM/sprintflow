"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { addColumn } from "@/store/slices/data-slice";
import type { Column } from "@/types";

export function AddColumn({
  projectId,
  columns,
}: {
  projectId: string;
  columns: Column[];
}) {
  const dispatch = useAppDispatch();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setAdding(false);
    setName("");
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Give the column a name.");
    if (trimmed.length > 24) return setError("At most 24 characters.");
    if (columns.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return setError("A column with that name exists.");
    }
    dispatch(addColumn(projectId, trimmed));
    toast.success(`Column “${trimmed}” added`, {
      description: "Use its ⋯ menu to set a WIP limit.",
    });
    close();
  };

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex h-24 w-[82vw] max-w-80 shrink-0 snap-center items-center justify-center gap-2 rounded-2xl border border-dashed text-sm text-muted-foreground outline-none transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-72"
      >
        <Plus className="size-4" />
        Add column
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === "Escape" && close()}
      className="w-[82vw] max-w-80 shrink-0 snap-center space-y-2 rounded-2xl border bg-muted/30 p-3 sm:w-72"
    >
      <Input
        autoFocus
        value={name}
        maxLength={24}
        placeholder="Column name…"
        aria-label="New column name"
        aria-invalid={error !== null}
        onChange={(e) => {
          setName(e.target.value);
          setError(null);
        }}
      />
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" size="sm">
          Add
        </Button>
      </div>
    </form>
  );
}
