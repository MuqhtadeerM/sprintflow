"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleChip } from "@/components/filters/toggle-chip";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addLabel, updateTask } from "@/store/slices/data-slice";
import type { Task } from "@/types";

const PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#06b6d4",
  "#84cc16",
];

export function LabelsSection({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const labels = useAppSelector((s) => s.data.labels);
  const [name, setName] = useState("");

  const toggle = (labelId: string) => {
    const next = task.labelIds.includes(labelId)
      ? task.labelIds.filter((id) => id !== labelId)
      : [...task.labelIds, labelId];
    dispatch(
      updateTask({
        id: task.id,
        changes: { labelIds: next },
        message: "Changed labels",
      }),
    );
  };

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length > 24) {
      toast.error("Label names can be at most 24 characters");
      return;
    }
    if (labels.some((l) => l.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A label with that name already exists");
      return;
    }
    dispatch(addLabel(trimmed, PALETTE[labels.length % PALETTE.length]));
    setName("");
    toast.success(`Label “${trimmed}” created`, {
      description: "Tap it to add it to this task.",
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {labels.map((l) => (
          <ToggleChip
            key={l.id}
            pressed={task.labelIds.includes(l.id)}
            onClick={() => toggle(l.id)}
            color={l.color}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: l.color }}
              aria-hidden="true"
            />
            {l.name}
          </ToggleChip>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              create();
            }
          }}
          placeholder="New label…"
          aria-label="New label name"
          className="h-8"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={create}
          disabled={!name.trim()}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
