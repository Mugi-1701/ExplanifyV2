"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LogOut, Sparkles } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";
import { getSidebarNavItemActive, resolveSidebarNavItemHref, sidebarNavItems } from "@/components/layout/sidebar-nav.config";
import { useActiveProjectId } from "@/hooks/use-active-project-id";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  onLogout: () => void;
};

function SidebarBrand() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(168,85,247,0.95),rgba(59,130,246,0.9))] text-white shadow-[0_0_35px_rgba(168,85,247,0.25)]">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold tracking-tight text-white">Explanify</p>
          <p className="whitespace-nowrap text-xs font-medium text-white/45">AI Coordination OS</p>
        </div>
      </div>
    </div>
  );
}

function SidebarNavItem({
  label,
  href,
  Icon,
  isActive,
  onClick,
}: {
  label: string;
  href: string;
  Icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
        isActive
          ? "border border-violet-400/20 bg-[linear-gradient(135deg,rgba(168,85,247,0.22),rgba(59,130,246,0.12))] text-white shadow-[0_0_32px_rgba(168,85,247,0.15)]"
          : "border border-transparent bg-transparent text-white/65 hover:bg-white/[0.03] hover:text-white"
      )}
    >
      <span
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          isActive
            ? "border-violet-300/20 bg-white/10 shadow-[0_0_18px_rgba(168,85,247,0.18)]"
            : "border border-white/10 bg-white/[0.03] text-white/55"
        )}
      >
        <Icon className="size-4" />
      </span>

      <span className="relative z-10 text-sm font-medium tracking-wide">{label}</span>

      {isActive ? (
        <motion.span
          layoutId="sidebar-active-glow"
          className="absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgba(168,85,247,0.18),rgba(59,130,246,0.10))]"
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        />
      ) : null}
    </Link>
  );
}

function SidebarUserCard({ user }: { user?: SidebarProps["user"] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(168,85,247,0.9),rgba(59,130,246,0.9))] text-sm font-semibold text-white shadow-[0_0_25px_rgba(59,130,246,0.22)]">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user?.name || "Explanify User"}</p>
          <p className="truncate text-xs text-white/50">{user?.email || "Coordination workspace"}</p>
        </div>
      </div>
    </div>
  );
}

function SidebarFooter({ user, onLogout }: { user?: SidebarProps["user"]; onLogout: () => void }) {
  return (
    <div className="space-y-3">
      <SidebarUserCard user={user} />
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-violet-400/20 hover:bg-violet-500/10"
      >
        <LogOut className="size-4" />
        Logout
      </button>
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeProjectId = useActiveProjectId();

  return (
    <div className="space-y-1.5">
      {sidebarNavItems.map((item) => {
        const Icon = item.icon;
        const href = resolveSidebarNavItemHref(item.href, activeProjectId);
        const isActive = getSidebarNavItemActive(pathname, href);

        return (
          <motion.div
            key={item.label}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <SidebarNavItem label={item.label} href={href} Icon={Icon} isActive={isActive} onClick={onNavigate} />
          </motion.div>
        );
      })}
    </div>
  );
}

function DesktopSidebar({ user, onLogout }: { user?: SidebarProps["user"]; onLogout: () => void }) {
  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-72 md:flex-col md:bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(to_bottom,rgba(6,8,22,0.96),rgba(5,8,22,0.98))] md:px-5 md:py-5 md:shadow-[0_0_80px_rgba(2,6,23,0.65)]">
      <div className="hidden-scrollbar flex h-full flex-col gap-4 overflow-y-auto px-1 py-1">
        <SidebarBrand />

        <div className="flex-1 py-1">
          <SidebarNav />
        </div>

        <SidebarFooter user={user} onLogout={onLogout} />
      </div>
    </aside>
  );
}

function MobileSidebar({ isOpen, onClose, user, onLogout }: { isOpen: boolean; onClose: () => void; user?: SidebarProps["user"]; onLogout: () => void }) {
  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: -24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_24%),linear-gradient(to_bottom,rgba(6,8,22,0.98),rgba(5,8,22,0.99))] p-4 shadow-[0_0_90px_rgba(2,6,23,0.75)] md:hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="hidden-scrollbar flex h-full flex-col gap-4 overflow-y-auto px-1 py-1">
              <div className="flex items-start justify-between gap-4">
                <SidebarBrand />
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10"
                  aria-label="Close navigation"
                >
                  <ChevronLeft className="size-5" />
                </button>
              </div>

              <div className="flex-1 py-1">
                <SidebarNav onNavigate={onClose} />
              </div>

              <SidebarFooter user={user} onLogout={onLogout} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function Sidebar({ isOpen, onClose, user, onLogout }: SidebarProps) {
  return (
    <>
      <DesktopSidebar user={user} onLogout={onLogout} />
      <MobileSidebar isOpen={isOpen} onClose={onClose} user={user} onLogout={onLogout} />
    </>
  );
}

export default Sidebar;
