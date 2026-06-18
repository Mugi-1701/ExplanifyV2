import type React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  detail?: string;
  action?: React.ReactNode;
  className?: string;
};

function EmptyState({ icon, title, description, detail, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-white/10 bg-white/[0.03]", className)}>
      <CardHeader className="space-y-4">
        {icon ? <div className="flex size-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-100">{icon}</div> : null}
        <div className="space-y-2">
          <CardTitle className="text-xl text-white">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-white/60">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail ? <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-6 text-white/55">{detail}</div> : null}
        {action ? <div>{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export { EmptyState };