"use client";

import { CalendarDays, CheckCircle2, PencilLine, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ProjectWithStats } from "@/types/project";
import { formatProjectDate, getCoordinationLabel, getCoordinationTone } from "./project-utils";

type ProjectRowProps = {
  project: ProjectWithStats;
  onSelect: (projectId: string) => void;
  onEdit: (project: ProjectWithStats) => void;
  onDelete: (project: ProjectWithStats) => void;
};

function ProjectRow({ project, onSelect, onEdit, onDelete }: ProjectRowProps) {
  return (
    <Card className={`border-white/10 bg-white/[0.03] ${project.isActive ? "ring-1 ring-violet-400/30" : ""}`}>
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <button type="button" onClick={() => onSelect(project.id)} className="flex-1 text-left">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-white">{project.name}</p>
              <p className="mt-1 text-sm text-white/55">{project.description || "No description provided."}</p>
            </div>
            <Badge variant="default" className={getCoordinationTone(project.stats.coordinationHealth)}>
              {getCoordinationLabel(project)}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/45">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
              <CalendarDays className="size-3.5" />
              Created {formatProjectDate(project.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1">
              {project.organization?.name ?? project.orgId ?? "Unknown org"}
            </span>
            {project.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-violet-100">
                <CheckCircle2 className="size-3.5" />
                Active
              </span>
            ) : null}
          </div>
        </button>

        <div className="grid grid-cols-3 gap-2 md:w-[380px]">
          <MiniStat label="Tasks" value={project.stats.taskCount} />
          <MiniStat label="Done" value={project.stats.completedTaskCount} tone="emerald" />
          <MiniStat label="Blocked" value={project.stats.blockedTaskCount} tone="amber" />
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button variant="outline" size="sm" onClick={() => onSelect(project.id)} className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
            {project.isActive ? "Selected" : "Set active"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(project)} className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
            <PencilLine className="mr-2 size-4" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(project)} className="rounded-full border-red-400/15 bg-red-500/10 text-red-100 hover:bg-red-500/20">
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

type MiniStatProps = {
  label: string;
  value: number;
  tone?: "emerald" | "amber" | "violet";
};

function MiniStat({ label, value, tone = "violet" }: MiniStatProps) {
  const toneClasses = {
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    violet: "border-violet-400/20 bg-violet-500/10 text-violet-100",
  } as const;

  return (
    <div className={`rounded-2xl border px-3 py-3 text-center ${toneClasses[tone]}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export { ProjectRow };