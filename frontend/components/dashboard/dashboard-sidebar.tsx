"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, PanelLeft, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSidebarNavItemActive, sidebarNavItems } from "@/components/layout/sidebar-nav.config";

type DashboardSidebarProps = {
  open: boolean;
  onClose: () => void;
};

type SidebarContentProps = {
  onNavigate?: () => void;
};

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="hidden-scrollbar flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-blue-500 shadow-[0_0_30px_rgba(168,85,247,0.35)]">
            <Sparkles className="size-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Explanify</p>
            <p className="text-xs text-white/50">AI Coordination OS</p>
          </div>
        </div>
        <ChevronLeft className="size-4 text-white/35 md:hidden" />
      </div>

      <div className="space-y-1">
        {sidebarNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = getSidebarNavItemActive(pathname, item.href);
          return (
            <motion.div key={item.label} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition",
                  isActive
                    ? "border-violet-400/30 bg-white/10 text-white shadow-[0_0_35px_rgba(168,85,247,0.14)]"
                    : "border-transparent bg-transparent text-white/60 hover:border-white/10 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="sidebar-active-glow"
                    className="absolute inset-0 rounded-2xl bg-[linear-gradient(135deg,rgba(168,85,247,0.24),rgba(59,130,246,0.16))]"
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  />
                ) : null}
                <span className="relative z-10 flex size-9 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                  <Icon className="size-4" />
                </span>
                <span className="relative z-10 text-sm font-medium">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-semibold text-white">
            AI
          </div>
          <div>
            <p className="text-sm font-medium text-white">Coordination Engine</p>
            <p className="text-xs text-white/50">Monitoring blockers in real time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-80 md:flex-col md:border-r md:border-white/10 md:bg-white/[0.03] md:backdrop-blur-2xl">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={onClose}
          >
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
              className="absolute left-0 top-0 h-full w-[86%] max-w-sm border-r border-white/10 bg-[#070b1d]/95 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="hidden-scrollbar flex h-full flex-col overflow-y-auto">
                <div className="flex items-center justify-between px-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <PanelLeft className="size-4" />
                  Navigation
                </div>
                <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} className="border border-white/10 bg-white/5 text-white/75 hover:bg-white/10" aria-label="Close navigation menu">
                  <ChevronLeft className="size-4" />
                </Button>
                </div>
                <SidebarContent onNavigate={onClose} />
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

export { DashboardSidebar };
