"use client";

import { useState } from "react";
import { nanoid } from "@reduxjs/toolkit";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { CommitInput } from "@/components/shared/commit-input";
import { useAppDispatch } from "@/store/hooks";
import { updateTask } from "@/store/slices/data-slice";
import { cn } from "@/lib/utils";
import type { ChecklistItem, Task } from "@/types";

export function ChecklistSection({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const [text, setText] = useState("");

  const save = (checklist: ChecklistItem[], message: string) =>
    dispatch(updateTask({ id: task.id, changes: { checklist }, message }));

  const done = task.checklist.filter((i) => i.done).length;
  const total = task.checklist.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const add = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    save(
      [...task.checklist, { id: nanoid(), text: trimmed, done: false }],
      "Added a checklist item",
    );
    setText("");
  };

  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">
              {done} of {total} done
            </span>
            {pct !== task.progress && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={() =>
                  dispatch(
                    updateTask({
                      id: task.id,
                      changes: { progress: pct },
                      message: `Set progress to ${pct}% from checklist`,
                    }),
                  )
                }
              >
                <Wand2 className="size-3" />
                Set progress to {pct}%
              </Button>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <ul className="space-y-1">
        {task.checklist.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <Checkbox
              checked={item.done}
              onCheckedChange={(checked) =>
                save(
                  task.checklist.map((i) =>
                    i.id === item.id ? { ...i, done: checked === true } : i,
                  ),
                  `${checked ? "Checked" : "Unchecked"} “${item.text}”`,
                )
              }
              aria-label={`Mark “${item.text}” as done`}
            />
            <CommitInput
              value={item.text}
              aria-label="Checklist item"
              className={cn(
                "h-8 border-transparent bg-transparent shadow-none hover:border-input focus-visible:border-input",
                item.done && "text-muted-foreground line-through",
              )}
              onCommit={(next) => {
                const trimmed = next.trim();
                if (!trimmed) return; // empty edit is ignored; use the bin to delete
                save(
                  task.checklist.map((i) =>
                    i.id === item.id ? { ...i, text: trimmed } : i,
                  ),
                  "Edited a checklist item",
                );
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              aria-label={`Delete “${item.text}”`}
              onClick={() =>
                save(
                  task.checklist.filter((i) => i.id !== item.id),
                  "Removed a checklist item",
                )
              }
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add an item…"
          aria-label="New checklist item"
          className="h-8"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={add}
          disabled={!text.trim()}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
