import type React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/35 shadow-sm backdrop-blur-xl transition outline-none focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/20",
        className
      )}
      {...props}
    />
  );
}

export { Input };