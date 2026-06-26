import type { ComponentType } from "react";
import {
  Bell,
  CalendarDays,
  CheckSquare,
  FolderKanban,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

type SidebarNavItem = {
  label: string;
  href: string | ((activeProjectId: string | null) => string);
  icon: ComponentType<{ className?: string }>;
};

const sidebarNavItems: SidebarNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "AI Coordination", href: "/ai-coordination", icon: Sparkles },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  {
    label: "Kanban",
    href: (activeProjectId) => (activeProjectId ? `/projects/${activeProjectId}/kanban` : "/projects"),
    icon: KanbanSquare,
  },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

function getSidebarNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveSidebarNavItemHref(href: SidebarNavItem["href"], activeProjectId: string | null) {
  return typeof href === "function" ? href(activeProjectId) : href;
}

export { sidebarNavItems, getSidebarNavItemActive };
export { resolveSidebarNavItemHref };
export type { SidebarNavItem };
