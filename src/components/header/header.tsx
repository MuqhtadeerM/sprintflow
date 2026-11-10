"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "./breadcrumbs";
import { ThemeToggle } from "./theme-toggle";
import { useAppDispatch } from "@/store/hooks";
import { setMobileNav } from "@/store/slices/ui-slice";

export function Header() {
  const dispatch = useAppDispatch();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
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
      </div>
    </header>
  );
}
