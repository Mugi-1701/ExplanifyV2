import type React from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

function SectionHeader({ eyebrow, title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-2">
        {eyebrow ? <p className="text-sm uppercase tracking-[0.22em] text-violet-200/80">{eyebrow}</p> : null}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
          {description ? <p className="max-w-3xl text-sm leading-7 text-white/65 md:text-base">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export { SectionHeader };