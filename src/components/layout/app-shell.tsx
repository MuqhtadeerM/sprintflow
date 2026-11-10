"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/sidebar/sidebar-content";
import { Header } from "@/components/header/header";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMobileNav } from "@/store/slices/ui-slice";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const collapsed = useAppSelector((s) => s.ui.sidebarCollapsed);
  const mobileOpen = useAppSelector((s) => s.ui.mobileNavOpen);

  // Close the mobile drawer whenever the user navigates.
  useEffect(() => {
    dispatch(setMobileNav(false));
  }, [pathname, dispatch]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop / tablet sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r bg-card transition-[width] duration-200 md:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      <Sheet
        open={mobileOpen}
        onOpenChange={(open) => dispatch(setMobileNav(open))}
      >
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent collapsed={false} showCollapseToggle={false} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
