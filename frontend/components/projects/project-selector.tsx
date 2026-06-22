"use client";

import { Sparkles } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
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
            <Select
              dropdownId="project-selector"
              value={activeProject?.id ?? ""}
              onChange={(v) => onSelectProject(v)}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
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