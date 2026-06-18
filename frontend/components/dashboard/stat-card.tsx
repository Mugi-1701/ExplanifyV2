"use client";

import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  accent?: "violet" | "blue" | "emerald" | "amber";
};

const accentStyles = {
  violet: "from-violet-500/35 to-fuchsia-500/10 ring-violet-500/20",
  blue: "from-blue-500/35 to-cyan-500/10 ring-blue-500/20",
  emerald: "from-emerald-500/30 to-cyan-500/10 ring-emerald-500/20",
  amber: "from-amber-500/30 to-orange-500/10 ring-amber-500/20",
} as const;

function StatCard({ label, value, description, accent = "violet" }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
      className="flex h-full flex-col"
    >
      <Card className="relative flex h-full min-h-[160px] flex-col overflow-hidden border-white/10 bg-white/6">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80", accentStyles[accent])} />
        <CardContent className="relative flex flex-1 flex-col p-6">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/55">{label}</p>
            <div className="text-3xl font-semibold text-white">{value}</div>
            <p className="text-sm leading-6 text-white/65">{description}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { StatCard };