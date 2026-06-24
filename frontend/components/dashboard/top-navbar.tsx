"use client";

import { Menu, Search, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

type TopNavbarProps = {
  onMenuClick: () => void;
};

function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const { user } = useAuth();

  const initials = (user?.name ?? user?.email ?? "EX")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const displayName = user?.name ?? "Explanify User";
  const displayRole = user?.email ?? "Workspace";

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(5,8,22,0.72)] backdrop-blur-2xl">
      <div className="flex items-center gap-4 px-4 py-4 md:px-8">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onMenuClick}
          className="border border-white/10 bg-white/5 text-white/80 shadow-[0_0_25px_rgba(168,85,247,0.08)] md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <Input
            className="h-12 rounded-2xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/30"
            placeholder="Search tasks, projects, blockers..."
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-100 md:flex">
            <Zap className="size-4" />
            AI Live
          </div>
          <NotificationDropdown />
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.24)]">
              {initials || "EX"}
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-medium text-white">{displayName}</span>
              <span className="text-xs text-white/50">{displayRole}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { TopNavbar };
