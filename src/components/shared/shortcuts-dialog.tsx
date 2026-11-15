"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { modKey } from "@/lib/platform";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setShortcutsOpen } from "@/store/slices/ui-slice";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-6 items-center justify-center rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
      {children}
    </kbd>
  );
}

export function ShortcutsDialog() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.shortcutsOpen);
  const mod = modKey();

  const rows: { keys: string[]; label: string }[] = [
    { keys: ["C"], label: "Create a task" },
    { keys: ["F"], label: "Focus search" },
    { keys: ["/"], label: "Open search" },
    { keys: [mod, "Z"], label: "Undo" },
    { keys: [mod, "Shift", "Z"], label: "Redo" },
    { keys: ["Esc"], label: "Close dialogs and drawers" },
    { keys: ["?"], label: "Show this list" },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => dispatch(setShortcutsOpen(next))}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Letter shortcuts are off while you type in a field.
          </DialogDescription>
        </DialogHeader>
        <ul className="divide-y">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              {r.label}
              <span className="flex items-center gap-1">
                {r.keys.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground">+</span>}
                    <Kbd>{k}</Kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
