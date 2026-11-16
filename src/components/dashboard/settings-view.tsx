"use client";

import { useRef, useState } from "react";
import {
  Download,
  Keyboard,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CommitInput } from "@/components/shared/commit-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import {
  importData,
  renameWorkspace,
  resetData,
} from "@/store/slices/data-slice";
import { closeTask, setShortcutsOpen } from "@/store/slices/ui-slice";
import { makeBackup, parseBackup } from "@/lib/backup";
import { todayStr } from "@/lib/date-utils";
import { downloadFile } from "@/lib/download";
import type { RemoteData } from "@/lib/data-source/types";
import { cn } from "@/lib/utils";

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-row-in rounded-2xl border bg-card p-5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

const THEMES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

const MAX_BYTES = 5 * 1024 * 1024;

export function SettingsView() {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const { theme, setTheme } = useTheme();
  const workspace = useAppSelector((s) => s.data.workspaces[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<RemoteData | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const usingApi = process.env.NEXT_PUBLIC_DATA_SOURCE === "http";

  const exportBackup = () => {
    downloadFile(
      `sprintflow-backup-${todayStr()}.json`,
      JSON.stringify(makeBackup(store.getState().data), null, 2),
      "application/json",
    );
    toast.success("Backup downloaded");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("That file is larger than 5 MB");
    } else {
      const result = parseBackup(await file.text());
      if (result.ok) setPending(result.data);
      else toast.error(result.error);
    }
    if (inputRef.current) inputRef.current.value = ""; // allow choosing the same file again
  };

  const confirmImport = () => {
    if (!pending) return;
    const current = store.getState().data.currentUserId;
    const me = pending.users.some((u) => u.id === current)
      ? current
      : (pending.users.find((u) => u.role === "lead") ?? pending.users[0]).id;
    dispatch(closeTask());
    dispatch(importData({ ...pending, currentUserId: me }));
    toast.success("Backup imported", {
      description: "You can undo this with Ctrl/Cmd+Z.",
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Workspace, appearance and your data.
        </p>
      </div>

      <Card
        title="Workspace"
        description="The name shown in the sidebar and breadcrumbs."
      >
        {workspace && (
          <CommitInput
            value={workspace.name}
            aria-label="Workspace name"
            maxLength={40}
            className="max-w-sm"
            onCommit={(next) => {
              const name = next.trim();
              if (!name) return toast.error("A workspace needs a name");
              dispatch(renameWorkspace({ id: workspace.id, name }));
              toast.success("Workspace renamed");
            }}
          />
        )}
      </Card>

      <Card
        title="Appearance"
        description="System follows your device setting."
      >
        <div
          role="group"
          aria-label="Theme"
          className="inline-flex rounded-lg border bg-muted/50 p-0.5"
        >
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={(theme ?? "system") === id}
              onClick={() => setTheme(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                (theme ?? "system") === id
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card
        title="Data"
        description={
          usingApi
            ? "Saved to the server API (.data/db.json)."
            : "Saved in this browser (localStorage). Back it up before clearing site data."
        }
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportBackup}>
            <Download className="size-4" />
            Export backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" />
            Import backup
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 dark:text-red-400"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw className="size-4" />
            Reset demo data
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </Card>

      <Card
        title="Keyboard"
        description="Shortcuts work everywhere except while typing in a field."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => dispatch(setShortcutsOpen(true))}
        >
          <Keyboard className="size-4" />
          View shortcuts
        </Button>
      </Card>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Replace your data with this backup?"
        description={`The backup holds ${pending?.tasks.length ?? 0} tasks in ${pending?.projects.length ?? 0} projects. Everything you have now is replaced. You can undo this with Ctrl/Cmd+Z.`}
        confirmLabel="Import"
        destructive
        onConfirm={confirmImport}
      />
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="This replaces everything with the original sample data. You can undo it with Ctrl/Cmd+Z."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          dispatch(closeTask());
          dispatch(resetData());
          toast.success("Demo data restored");
        }}
      />
    </div>
  );
}
