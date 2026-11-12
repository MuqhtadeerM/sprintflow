"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";
import { ProfileMenu } from "./profile-menu";
import { SprintSelector } from "./sprint-selector";
import { ViewSwitcher } from "./view-switcher";
import { useProjectContext } from "@/hooks/use-project-context";
import { useAppDispatch } from "@/store/hooks";
import { setMobileNav } from "@/store/slices/ui-slice";

export function Header() {
  const dispatch = useAppDispatch();
  const { project } = useProjectContext();

  return (
    <div className="shrink-0 border-b bg-background">
      <header className="flex h-14 items-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={() => dispatch(setMobileNav(true))}
        >
          <Menu className="size-5" />
        </Button>
        <Breadcrumbs />
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </header>

      {/* Project toolbar: only on project pages */}
      {project && (
        <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
          <SprintSelector />
          <ViewSwitcher className="ml-auto" />
        </div>
      )}
    </div>
  );
}
