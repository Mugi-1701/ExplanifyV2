import { CalendarDays, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectWithStats } from "@/types/project";
import { formatProjectDate, getCoordinationTone } from "./project-utils";

type ProjectInsightsCardProps = {
  project: ProjectWithStats | null;
};

function ProjectInsightsCard({ project }: ProjectInsightsCardProps) {
  if (!project) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-xl text-white">Project insights</CardTitle>
          <CardDescription className="text-white/60">Select a project to see its coordination profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-white">{project.name}</CardTitle>
            <CardDescription className="mt-2 text-white/60">{project.description || "No description provided."}</CardDescription>
          </div>
          <div className={`rounded-2xl border px-3 py-2 text-xs font-medium ${getCoordinationTone(project.stats.coordinationHealth)}`}>
            {project.stats.coordinationHealth}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          <div className="flex items-center gap-2 text-blue-200">
            <Sparkles className="size-4" />
            AI coordination
          </div>
          <p>{project.stats.coordinationReason}</p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-white/45" />
            Created {formatProjectDate(project.createdAt)}
          </div>
          <div>Organization: {project.organization?.name ?? project.orgId ?? "Unknown org"}</div>
          <div>Tasks: {project.stats.taskCount}</div>
          <div>Blocked tasks: {project.stats.blockedTaskCount}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export { ProjectInsightsCard };