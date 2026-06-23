"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <main className="hidden-scrollbar relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_32%),linear-gradient(to_bottom,#050816,#050816)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-violet-200/80">Explanify</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="text-sm text-white/60">{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </main>
  );
}

export { AuthShell };
