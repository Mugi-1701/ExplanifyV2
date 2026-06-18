import type React from "react";

import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: "default" | "success" | "warning" | "purple" | "blue" | "destructive" | "muted" }) {
  const styles = {
    default: "border-white/10 bg-white/10 text-white/75",
    muted: "border-white/10 bg-white/5 text-white/55",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    purple: "border-violet-400/20 bg-violet-400/10 text-violet-200",
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-200",
    destructive: "border-rose-400/20 bg-rose-500/10 text-rose-100",
  } as const;

  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };