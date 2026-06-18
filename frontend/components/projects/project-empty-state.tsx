import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectEmptyStateProps = {
  title?: string;
  description?: string;
  detail?: string;
};

function ProjectEmptyState({
  title = "No projects found",
  description = "Create a new project to start tracking tasks, dependencies, and AI coordination health.",
  detail = "Projects will appear here once the backend returns live records.",
}: ProjectEmptyStateProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-100">
          <Sparkles className="size-5" />
        </div>
        <CardTitle className="mt-3 text-xl text-white">{title}</CardTitle>
        <CardDescription className="text-white/60">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/55">
          {detail}
        </div>
      </CardContent>
    </Card>
  );
}

export { ProjectEmptyState };
