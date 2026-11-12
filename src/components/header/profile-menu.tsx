"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetData } from "@/store/slices/data-slice";
import { closeTask } from "@/store/slices/ui-slice";

export function ProfileMenu() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) =>
    s.data.users.find((u) => u.id === s.data.currentUserId),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open profile menu"
        >
          <UserAvatar user={user} size={32} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="space-y-0.5">
              <span className="block text-sm font-medium text-foreground">
                {user.name}
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
            <RotateCcw className="size-4" />
            Reset demo data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Outside the menu on purpose: the menu unmounts when it closes. */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Reset demo data?"
        description="This replaces all projects, tasks and columns with the original sample data. Your changes will be lost."
        confirmLabel="Reset"
        destructive
        onConfirm={() => {
          dispatch(closeTask());
          dispatch(resetData());
          toast.success("Demo data restored");
        }}
      />
    </>
  );
}
