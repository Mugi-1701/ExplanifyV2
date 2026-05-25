"use client";

import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, PencilLine, ShieldAlert, Sparkles, Trash2 } from "lucide-react";

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
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
      <Card className={`h-full overflow-hidden border-white/10 bg-white/[0.04] ${project.isActive ? "ring-1 ring-violet-400/30" : ""}`}>
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl text-white">{project.name}</CardTitle>
              <CardDescription className="mt-2 min-h-12 text-white/60">
                {project.description || "No description provided yet."}
              </CardDescription>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white/65">
              <Sparkles className="size-5 text-violet-200" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className={getCoordinationTone(project.stats.coordinationHealth)}>
              {getCoordinationLabel(project)}
            </Badge>
            {project.isActive ? <Badge variant="purple">Active project</Badge> : <Badge variant="default">Selectable</Badge>}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Tasks" value={project.stats.taskCount} />
            <StatTile label="Done" value={project.stats.completedTaskCount} tone="emerald" />
            <StatTile label="Blocked" value={project.stats.blockedTaskCount} tone="amber" />
          </div>

          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldAlert className="size-4" />
              AI coordination health
            </div>
            <p>{project.stats.coordinationReason}</p>
            <div className="flex items-center justify-between text-xs text-white/45">
              <span>Created {formatProjectDate(project.createdAt)}</span>
              <span>{project.organization?.name ?? project.orgId ?? "Unknown org"}</span>
            </div>
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

type StatTileProps = {
  label: string;
  value: number;
  tone?: "emerald" | "amber" | "violet";
};

function StatTile({ label, value, tone = "violet" }: StatTileProps) {
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

export { ProjectCard };