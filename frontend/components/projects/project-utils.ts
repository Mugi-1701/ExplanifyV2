import type { ProjectStats, ProjectWithStats } from "@/types/project";

function formatProjectDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getCoordinationTone(health: ProjectStats["coordinationHealth"]) {
  switch (health) {
    case "HEALTHY":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "BLOCKED":
      return "border-amber-400/20 bg-amber-500/10 text-amber-200";
    case "WARNING":
      return "border-orange-400/20 bg-orange-500/10 text-orange-200";
    case "READY":
      return "border-blue-400/20 bg-blue-500/10 text-blue-200";
    case "EMPTY":
    default:
      return "border-white/10 bg-white/5 text-white/65";
  }
}

function getCoordinationLabel(project: ProjectWithStats) {
  if (project.isActive && project.stats.taskCount === 0) {
    return "Active • no tasks";
  }

  return project.stats.coordinationHealth;
}

export { formatProjectDate, getCoordinationLabel, getCoordinationTone };