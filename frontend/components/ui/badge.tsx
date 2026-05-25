import type React from "react";

import { cn } from "@/lib/utils";

function Badge({ className, variant = "default", ...props }: React.ComponentProps<"span"> & { variant?: "default" | "success" | "warning" | "purple" }) {
  const styles = {
    default: "border-white/10 bg-white/10 text-white/75",
    success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    purple: "border-violet-400/20 bg-violet-400/10 text-violet-200",
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