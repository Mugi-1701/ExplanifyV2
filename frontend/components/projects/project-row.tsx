"use client";

import { CheckCircle2, PencilLine, Trash2 } from "lucide-react";

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
  const organizationLabel = project.organization?.name ?? project.orgId ?? null;
  const metadataLabel = organizationLabel ? `${organizationLabel} • ${project.isActive ? "Active" : "Selectable"}` : project.isActive ? "Active" : "Selectable";

  return (
    <Card className={`border-white/10 bg-white/[0.03] ${project.isActive ? "ring-1 ring-violet-400/30" : ""}`}>
      <div className="flex flex-col gap-3 p-3.5 md:flex-row md:items-center md:justify-between">
        <button type="button" onClick={() => onSelect(project.id)} className="flex-1 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-white" title={project.name}>
                {project.name}
              </p>
              <p className="mt-1 line-clamp-2 text-[0.8125rem] leading-relaxed text-white/55">{project.description || "No description provided"}</p>
            </div>
            <Badge variant="default" className={`shrink-0 px-2.5 py-0.5 text-[11px] font-medium ${getCoordinationTone(project.stats.coordinationHealth)}`}>
              {getCoordinationLabel(project)}
            </Badge>
          </div>
          <div className="mt-2 flex items-center gap-3 text-[0.8125rem] text-white/50">
            <span className="truncate">Created {formatProjectDate(project.createdAt)}</span>
            <span className="text-white/25">•</span>
            <span className="truncate">{metadataLabel}</span>
          </div>
        </button>

        <div className="flex flex-nowrap gap-2 md:max-w-[280px] md:justify-end">
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
    <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8125rem] leading-none ${toneClasses[tone]}`}>
      <span className="font-medium">{value}</span>
      <span className="text-white/65">{label}</span>
    </div>
  );
}

export { ProjectRow };
