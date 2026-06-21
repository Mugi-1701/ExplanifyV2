"use client";

import { motion } from "framer-motion";
import { CheckCircle2, PencilLine, ShieldAlert, Sparkles, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectWithStats } from "@/types/project";
import { formatProjectDate, getCoordinationLabel, getCoordinationTone } from "./project-utils";

type ProjectCardProps = {
  project: ProjectWithStats;
  onSelect: (projectId: string) => void;
  onEdit: (project: ProjectWithStats) => void;
  onDelete: (project: ProjectWithStats) => void;
};

function ProjectCard({ project, onSelect, onEdit, onDelete }: ProjectCardProps) {
  const organizationLabel = project.organization?.name ?? project.orgId ?? null;
  const createdLabel = `Created ${formatProjectDate(project.createdAt)}`;
  const metadataLabel = organizationLabel ? `${organizationLabel} • ${project.isActive ? "Active" : "Selectable"}` : project.isActive ? "Active" : "Selectable";

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
      <Card className={`h-full overflow-hidden border-white/10 bg-white/[0.04] ${project.isActive ? "ring-1 ring-violet-400/30" : ""}`}>
        <CardHeader className="space-y-2 p-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-xl font-bold text-white" title={project.name}>
                {project.name}
              </CardTitle>
              <CardDescription className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-[0.8125rem] leading-relaxed text-white/60">
                {project.description || "No description provided"}
              </CardDescription>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/65">
              <Sparkles className="size-4 text-violet-200" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className={`px-2.5 py-0.5 text-[11px] font-medium ${getCoordinationTone(project.stats.coordinationHealth)}`}>
              {getCoordinationLabel(project)}
            </Badge>
            {project.isActive ? (
              <Badge variant="purple" className="px-2.5 py-0.5 text-[11px] font-medium">
                Active project
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-3 text-[0.8125rem] text-white/50">
            <span className="truncate">{createdLabel}</span>
            <span className="text-white/25">•</span>
            <span className="truncate">{metadataLabel}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4 pt-0">
          <div className="flex flex-nowrap gap-2 overflow-hidden">
            <StatChip label="Tasks" value={project.stats.taskCount} />
            <StatChip label="Done" value={project.stats.completedTaskCount} tone="emerald" />
            <StatChip label="Blocked" value={project.stats.blockedTaskCount} tone="amber" />
          </div>

          <div className="grid gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldAlert className="size-4" />
              AI coordination health
            </div>
            <p className="line-clamp-2">{project.stats.coordinationReason}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(project.id)}
              className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <CheckCircle2 className="mr-2 size-4" />
              {project.isActive ? "Selected" : "Set active"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(project)}
              className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <PencilLine className="mr-2 size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(project)}
              className="rounded-full border-red-400/15 bg-red-500/10 text-red-100 hover:bg-red-500/20"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

type StatChipProps = {
  label: string;
  value: number;
  tone?: "emerald" | "amber" | "violet";
};

function StatChip({ label, value, tone = "violet" }: StatChipProps) {
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

export { ProjectCard };
