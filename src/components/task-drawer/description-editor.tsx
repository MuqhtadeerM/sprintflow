"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/shared/markdown";
import { useAppDispatch } from "@/store/hooks";
import { updateTask } from "@/store/slices/data-slice";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

type Mode = "write" | "preview";

export function DescriptionEditor({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<Mode>("write");
  const [draft, setDraft] = useState("");

  const startEditing = () => {
    setDraft(task.description);
    setMode("write");
    setEditing(true);
  };

  const save = () => {
    if (draft !== task.description) {
      dispatch(
        updateTask({
          id: task.id,
          changes: { description: draft },
          message: `Edited description of “${task.title}”`,
        }),
      );
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="group relative rounded-lg border border-transparent p-2 -m-2 transition-colors hover:border-border">
        {task.description.trim() ? (
          <Markdown>{task.description}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">No description yet.</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={startEditing}
          className="mt-2 gap-1.5"
        >
          <Pencil className="size-3.5" />
          {task.description.trim() ? "Edit" : "Add description"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="Editor mode"
        className="inline-flex rounded-lg border bg-muted/50 p-0.5"
      >
        {(["write", "preview"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring",
              mode === m ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "write" ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={8}
          autoFocus
          aria-label="Description (Markdown)"
          placeholder="Supports **bold**, lists, `code` and [links](https://example.com)"
          className="font-mono text-sm"
        />
      ) : (
        <div className="min-h-[10rem] rounded-lg border p-3">
          {draft.trim() ? (
            <Markdown>{draft}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
