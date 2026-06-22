"use client";

import { motion } from "framer-motion";
import { CheckCircle2, PencilLine, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { getTeams, type Team } from "@/services/team.service";

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
  // debug logs to verify incoming data
  // eslint-disable-next-line no-console
  console.log("ProjectCard render", { id: project.id, teamId: project.teamId });
  // explicit logs requested for tracing
  // eslint-disable-next-line no-console
  console.log(project.id);
  // eslint-disable-next-line no-console
  console.log(project.teamId);

  // team coordination id may be provided on a nested team object or as a numeric code
  const maybeTeam = (project as any).team ?? null;
  const teamCode = maybeTeam?.generatedId || maybeTeam?.code || maybeTeam?.teamNumber || null;
  const teamIdFromField = (() => {
    if (typeof project.teamId === "string" && /^\d{4}$/.test(project.teamId)) return project.teamId;
    if (typeof project.teamId === "number" && /^\d{4}$/.test(String(project.teamId))) return String(project.teamId);
    return null;
  })();
  const displayTeamId = teamCode || teamIdFromField;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const [resolvedTeamDisplay, setResolvedTeamDisplay] = useState<string | null>(displayTeamId);

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!menuRef.current) return;
      if (menuRef.current.contains(target)) return;
      if (menuButtonRef.current && menuButtonRef.current.contains(target)) return;
      setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [menuOpen]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [menuOpen]);

  useEffect(() => {
    // If we don't have a 4-digit display id but there is a teamId (UUID), try to resolve team info
    if (!resolvedTeamDisplay && project.teamId && project.orgId) {
      let mounted = true;
      (async () => {
        try {
          const teams = await getTeams(project.orgId ?? undefined);
          if (!mounted) return;
          const found = teams.find((t: Team) => t.id === project.teamId);
          if (found) {
            // prefer a numeric/code field if present, otherwise use team name
            // show a short fallback of last 4 chars of id if nothing else
            // @ts-ignore
            const code = (found as any).generatedId || (found as any).code || null;
            if (code && /^\d{4}$/.test(String(code))) {
              setResolvedTeamDisplay(String(code));
            } else if (found.name) {
              setResolvedTeamDisplay(found.name);
            } else {
              setResolvedTeamDisplay(String(found.id).slice(-4));
            }
          }
        } catch (e) {
          // ignore
        }
      })();

      return () => {
        mounted = false;
      };
    }
  }, [resolvedTeamDisplay, project.teamId, project.orgId]);

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
      <Card className={`group h-full overflow-visible border-white/10 bg-white/[0.04] ${project.isActive ? "ring-1 ring-violet-400/40 shadow-[0_10px_30px_-18px_rgba(167,139,250,0.18)]" : ""}`}>
        <CardHeader className="space-y-1 p-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-xl font-bold text-white" title={project.name}>
                {project.name}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2 min-h-[2rem] text-[0.8125rem] leading-relaxed text-white/60">
                {project.description || "No description provided"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/65">
                <Sparkles className="size-4 text-violet-200" />
              </div>
              {/* overflow menu placeholder — moved Edit/Delete out of primary actions below */}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" className={`${getCoordinationTone(project.stats.coordinationHealth)} text-[11px] font-medium`}>{getCoordinationLabel(project)}</Badge>
            {project.isActive ? (
              <Badge variant="muted" className="px-2 py-0.5 text-[10px] font-medium">
                Active
              </Badge>
            ) : null}
          </div>

          <div className="mt-1 text-[0.8125rem] text-white/50">
            <div>{createdLabel}</div>
            {organizationLabel ? (
              <div className="truncate">
                {organizationLabel}
                {resolvedTeamDisplay ? (
                  <>
                    <span className="text-white/40"> &nbsp;•&nbsp; </span>
                    <span className="text-sm text-white/50">Team #{resolvedTeamDisplay}</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-4 pt-0">
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatColumn>
              <StatChip label="Tasks" value={project.stats.taskCount} />
            </StatColumn>
            <StatColumn>
              <StatChip label="Done" value={project.stats.completedTaskCount} tone="emerald" />
            </StatColumn>
            <StatColumn>
              <StatChip label="Blocked" value={project.stats.blockedTaskCount} tone="amber" />
            </StatColumn>
          </div>

          <div className="grid gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
            <div className="flex items-center gap-2 text-blue-200">
              <ShieldAlert className="size-4" />
              AI coordination health
            </div>
            <p className="line-clamp-2">{project.stats.coordinationReason}</p>
          </div>

          <div className="flex items-center justify-between gap-3">
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
                onClick={() => {
                  onSelect(project.id);
                  try {
                    window.dispatchEvent(new CustomEvent("view-project", { detail: { projectId: project.id, activeTab: "tasks" } }));
                  } catch (e) {
                    // noop
                  }
                }}
                className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                View Project
              </Button>
            </div>

            <div className="relative">
              <div className="relative inline-block">
                <button
                  ref={menuButtonRef}
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  title="More"
                >
                  ⋯
                </button>

                {menuOpen ? (
                  <div ref={menuRef} className="absolute right-0 bottom-full mb-2 z-[9999] w-44 rounded-lg border border-white/10 bg-black/80 p-2 shadow-lg">
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-white hover:bg-white/5"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(project);
                      }}
                    >
                      <PencilLine className="size-4" />
                      Edit
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-red-100 hover:bg-red-500/10"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(project);
                      }}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
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
    <div className={`w-full flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center text-[0.8125rem] ${toneClasses[tone]}`}>
      <span className="font-semibold text-lg leading-none">{value}</span>
      <span className="text-white/65 text-xs">{label}</span>
    </div>
  );
}

function StatColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center">{children}</div>;
}

export { ProjectCard };
