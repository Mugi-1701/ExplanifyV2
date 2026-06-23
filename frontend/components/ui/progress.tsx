"use client";

import { cn } from "@/lib/utils";

type ProgressProps = {
  value?: number;
  className?: string;
  indicatorClassName?: string;
};

function Progress({ value = 0, className, indicatorClassName }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div className={cn("h-full rounded-full transition-all duration-300", indicatorClassName)} style={{ width: `${safeValue}%` }} />
    </div>
  );
}

export { Progress };
