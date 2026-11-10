"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar } from "@/store/slices/ui-slice";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Tasks", href: "/my-tasks", icon: ListChecks },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Timeline", href: "/timeline", icon: CalendarRange },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center",
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  showCollapseToggle?: boolean;
}

export function SidebarContent({
  collapsed,
  showCollapseToggle = true,
}: SidebarContentProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.data.users);
  const projects = useAppSelector((s) => s.data.projects);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="p-2">
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>
      <Separator />

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}

        {!collapsed && (
          <>
            <p className="px-2.5 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your projects
            </p>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
                  pathname === `/projects/${p.id}` && "bg-muted font-medium",
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: p.color }}
                />
                <span className="truncate">{p.name}</span>
              </Link>
            ))}
          </>
        )}

        <p
          className={cn(
            "px-2.5 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
            collapsed && "sr-only",
          )}
        >
          Team members
        </p>
        <ul
          className={cn("space-y-1", collapsed && "flex flex-col items-center")}
        >
          {users.map((u) => (
            <li key={u.id}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger render={<span className="block p-1" />}>
                    <UserAvatar user={u} size={26} />
                  </TooltipTrigger>
                  <TooltipContent side="right">{u.name}</TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex items-center gap-3 px-2.5 py-1.5 text-sm">
                  <UserAvatar user={u} size={24} />
                  <span className="truncate">{u.name}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {showCollapseToggle && (
        <>
          <Separator />
          <div className={cn("p-2", collapsed && "flex justify-center")}>
            <Button
              variant="ghost"
              size={collapsed ? "icon" : "sm"}
              onClick={() => dispatch(toggleSidebar())}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(!collapsed && "w-full justify-start gap-3")}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <>
                  <PanelLeftClose className="size-4" />
                  Collapse
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
