"use client";

import { useRef } from "react";
import { nanoid } from "@reduxjs/toolkit";
import { Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/store/hooks";
import { updateTask } from "@/store/slices/data-slice";
import type { Attachment, Task } from "@/types";

const MAX_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsSection({ task }: { task: Task }) {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const save = (attachments: Attachment[], message: string) =>
    dispatch(updateTask({ id: task.id, changes: { attachments }, message }));

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted: Attachment[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is larger than 10 MB`);
        continue;
      }
      accepted.push({
        id: nanoid(),
        name: file.name,
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
      });
    }
    if (accepted.length > 0) {
      save(
        [...task.attachments, ...accepted],
        `Attached ${accepted.length} file(s)`,
      );
    }
    if (inputRef.current) inputRef.current.value = ""; // allow picking the same file again
  };

  return (
    <div className="space-y-3">
      {task.attachments.length > 0 && (
        <ul className="space-y-1">
          {task.attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
            >
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{a.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatBytes(a.sizeBytes)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                aria-label={`Remove ${a.name}`}
                onClick={() =>
                  save(
                    task.attachments.filter((x) => x.id !== a.id),
                    `Removed ${a.name}`,
                  )
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" />
        Attach files
      </Button>
      <p className="text-xs text-muted-foreground">
        Demo mode: file names and sizes are saved, not the files themselves.
      </p>
    </div>
  );
}
