"use client";

import { ChevronDown, Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectWithStats } from "@/types/project";

type ProjectSelectorProps = {
  projects: ProjectWithStats[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
};

function ProjectSelector({ projects, activeProjectId, onSelectProject }: ProjectSelectorProps) {
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? null;

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-100">
            <Sparkles className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg text-white">Active project selector</CardTitle>
            <CardDescription className="text-white/60">Switch the active project that powers dashboard and task views.</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <label className="block text-xs uppercase tracking-[0.18em] text-white/45">
          Current project
          <div className="relative mt-2">
            <select
              value={activeProject?.id ?? ""}
              onChange={(event) => onSelectProject(event.target.value)}
              className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-10 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          </div>
        </label>

        {activeProject ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p className="font-medium text-white">{activeProject.name}</p>
            <p className="mt-1 text-white/55">{activeProject.organization?.name ?? activeProject.orgId ?? "Unknown organization"}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/40">
              {activeProject.isActive ? "Active project" : "Available project"}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/55">
            No projects available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { ProjectSelector };