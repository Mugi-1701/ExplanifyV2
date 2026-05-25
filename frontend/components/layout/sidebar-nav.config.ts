import type { ComponentType } from "react";
import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

type SidebarNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const sidebarNavItems: SidebarNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "AI Coordination", href: "/ai-coordination", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];

function getSidebarNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export { sidebarNavItems, getSidebarNavItemActive };
export type { SidebarNavItem };