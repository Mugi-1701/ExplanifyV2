"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, CalendarDays, ChevronRight, Crown, ListTodo, Plus, Sparkles, Users } from "lucide-react";
import { Select } from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityTimeline } from "@/components/events";
import { canShowDeleteProject, canShowManageMembers } from "@/lib/rbac";
import { queryDefaults } from "@/lib/query-client";
import { useRole } from "@/hooks/useRole";
import { getWorkloadAnalysis } from "@/services/ai.service";
import type { ProjectMember, ProjectWithStats } from "@/types/project";
import { formatProjectDate, getCoordinationTone } from "./project-utils";
import { RecommendationCard } from "./recommendation-card";
import { RecommendationModal } from "./recommendation-modal";

type ProjectInsightsCardProps = {
  project: ProjectWithStats | null;
  activeTab: "overview" | "tasks" | "team" | "activity";
  onTabChange: (tab: "overview" | "tasks" | "team" | "activity") => void;
  onAddMember: () => void;
  onEditMember: (member: ProjectMember) => void;
  onRemoveMember: (member: ProjectMember) => void;
  onEditProject?: () => void;
  onArchiveProject?: () => void;
  onDeleteProject?: () => void;
  onChangeLead?: (userId: string) => void;
};

function ProjectInsightsCard({ project, activeTab, onTabChange, onAddMember, onEditMember, onRemoveMember, onEditProject, onArchiveProject, onDeleteProject, onChangeLead }: ProjectInsightsCardProps) {
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const role = useRole();
  const allowManageMembers = canShowManageMembers(role);
  const allowRoleManagement = canShowManageMembers(role);
  const allowDeleteProject = canShowDeleteProject(role);
  const workloadQuery = useQuery({
    queryKey: ["ai-workload-analysis", project?.id ?? "__missing__"],
    queryFn: () => getWorkloadAnalysis(project?.id ?? ""),
    enabled: Boolean(project?.id),
    staleTime: queryDefaults.staleTime,
    gcTime: queryDefaults.gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  if (!project) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-xl text-white">Project details</CardTitle>
          <CardDescription className="text-white/60">Select a project to see overview, tasks, and team.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const members = project.members ?? [];
  const tasks = project.tasks ?? [];
  const progress = project.progressPercentage ?? project.stats?.progressPercentage ?? 0;
  const workloadAnalysis = workloadQuery.data ?? null;

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-white">{project.name}</CardTitle>
            <CardDescription className="mt-2 text-white/60">{project.description || "No description provided."}</CardDescription>
          </div>
          <div className={`rounded-2xl border px-3 py-2 text-xs font-medium ${getCoordinationTone(project.stats?.coordinationHealth ?? "EMPTY")}`}>
            {project.stats?.coordinationHealth ?? "EMPTY"}
          </div>
        </div>

        <div className="project-tabs grid w-full grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
          {[
            { key: "overview", label: "Overview" },
            { key: "tasks", label: "Tasks" },
            { key: "team", label: "Team" },
            { key: "activity", label: "Activity" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key as "overview" | "tasks" | "team" | "activity")}
              className={`flex w-full items-center justify-center rounded-2xl px-3 py-3 text-sm leading-none transition ${
                activeTab === tab.key ? "bg-violet-500/20 text-violet-100" : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="hidden-scrollbar space-y-4">
        {activeTab === "overview" ? (
          <>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              <div className="flex items-center gap-2 text-blue-200">
                <Sparkles className="size-4" />
                Project overview
              </div>
              <p>{project.stats?.coordinationReason ?? "No task stats available yet."}</p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-white/45" />
                Created {formatProjectDate(project.createdAt)}
              </div>
              <div>Organization: {project.organization?.name ?? project.orgId ?? "Unknown org"}</div>
              <div>Priority: {(project as any).priority ?? "Unspecified"}</div>
              <div>Project lead: {project.members?.find((m) => m.role === "Tech Lead")?.user?.name ?? "Unassigned"}</div>
              <div>Start date: {(project.startDate && formatProjectDate(project.startDate)) ?? "—"}</div>
              <div>Target date: {(project.dueDate && formatProjectDate(project.dueDate)) ?? "—"}</div>
              <div>Tasks: {project.stats?.taskCount ?? 0}</div>
              <div>Blocked tasks: {project.stats?.blockedTaskCount ?? 0}</div>
              <div>Team members: {members.length}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-white/55">Progress</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{progress}%</p>
                </div>
                <p className="text-sm text-white/50">
                  {project.stats?.completedTaskCount ?? 0}/{project.stats?.taskCount ?? 0} tasks done
                </p>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 via-blue-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>

            <WorkloadAnalysisSection
              analysis={workloadAnalysis}
              isLoading={workloadQuery.isLoading}
              onViewAllRecommendations={() => setRecommendationsOpen(true)}
            />
          </>
        ) : null}

        {activeTab === "tasks" ? (
          <div className="space-y-3">
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              <div className="flex items-center gap-2 text-blue-200">
                <ListTodo className="size-4" />
                Task summary
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Metric label="Assigned" value={tasks.filter((task) => Boolean(task.assigneeId)).length} />
                <Metric label="Active" value={tasks.filter((task) => task.status === "IN_PROGRESS").length} />
                <Metric label="Completed" value={tasks.filter((task) => task.status === "DONE").length} />
              </div>
              <p className="text-white/50">Task assignment is managed from the Create Task and Task Details flows.</p>
            </div>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">No Tasks Found.</div>
              ) : (
                tasks.map((task: any) => {
                  // Use title delivered by backend directly. Avoid placeholder fallback here — backend should return the title.
                  const displayTitle = task.title ?? task.name ?? "";
                  const assignee = members.find((m) => m.userId === task.assigneeId)?.user?.name ?? null;
                  return (
                    <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-white font-medium">{displayTitle}</div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="rounded-full border px-2 py-1 text-white/70">{task.status}</div>
                          <div className="text-white/60">{assignee ?? "Unassigned"}</div>
                          <div className="text-white/50">{task.dueDate ? formatProjectDate(task.dueDate) : ""}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {activeTab === "team" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-white">
                <Users className="size-4 text-violet-200" />
                Team Members
              </div>
              {allowManageMembers ? (
                <Button variant="outline" size="sm" onClick={onAddMember} className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
                  <Plus className="mr-2 size-4" />
                  Add Member
                </Button>
              ) : null}
            </div>

            <div className="space-y-3">
              {members.length > 0 ? members.map((member) => <MemberCard key={member.id} member={member} tasks={tasks} onEdit={onEditMember} onRemove={onRemoveMember} allowManageMembers={allowManageMembers} allowRoleManagement={allowRoleManagement} />) : <p className="text-sm text-white/50">No members have been added yet.</p>}
            </div>
          </div>
        ) : null}

        {activeTab === "activity" ? (
          <ActivityTimeline
            scope="project"
            id={project.id}
            title="Project activity"
            description="A chronological trail of project and task events."
          />
        ) : null}
      </CardContent>
      <RecommendationModal
        open={recommendationsOpen}
        recommendations={workloadAnalysis?.recommendations ?? []}
        onClose={() => setRecommendationsOpen(false)}
      />
    </Card>
  );
}

function MemberCard({
  member,
  tasks,
  onEdit,
  onRemove,
  allowManageMembers,
  allowRoleManagement,
}: {
  member: ProjectMember;
  tasks: { assigneeId?: string | null; status: string }[];
  onEdit: (member: ProjectMember) => void;
  onRemove: (member: ProjectMember) => void;
  allowManageMembers: boolean;
  allowRoleManagement: boolean;
}) {
  const assignedTaskCount = member.assignedTaskCount ?? tasks.filter((task) => task.assigneeId === member.userId).length;
  const activeTaskCount = member.activeTaskCount ?? tasks.filter((task) => task.assigneeId === member.userId && task.status === "IN_PROGRESS").length;
  const completedTaskCount = member.completedTaskCount ?? tasks.filter((task) => task.assigneeId === member.userId && task.status === "DONE").length;

  const roleLabel = formatRoleLabel(member.role ?? "Member");
  const isLead = roleLabel === "Lead";
  const emailLabel = member.user?.email ?? "";
  const joinedLabel = member.createdAt ? `Joined ${formatProjectDate(member.createdAt)}` : null;
  const skillLabels = getMemberSkillLabels(member);

  return (
    <div className={`rounded-2xl border px-4 py-3 ${isLead ? "border-violet-400/40 bg-white/6" : "border-white/10 bg-white/5"}`}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto,minmax(0,1fr)] md:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/5 md:size-14 ${isLead ? "ring-2 ring-violet-400/40" : ""}`}>
            {member.user?.avatarUrl ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={member.user.avatarUrl} alt={`avatar-${member.user?.name ?? member.userId}`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-white/80 md:text-base">{getInitials(member.user?.name ?? member.userId)}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-white" title={member.user?.name ?? "Unknown member"}>
                  {member.user?.name ?? "Unknown member"}
                </p>
                <p className="truncate text-xs text-white/50 md:text-sm" title={emailLabel}>
                  {emailLabel}
                </p>
                {joinedLabel ? <p className="text-[11px] text-white/40">{joinedLabel}</p> : null}
              </div>

              <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
                {isLead ? <Crown className="size-3 text-violet-300" /> : null}
                <span>{roleLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Metric label="Assigned" value={assignedTaskCount} />
              <Metric label="Active" value={activeTaskCount} />
              <Metric label="Done" value={completedTaskCount} />
            </div>

            {skillLabels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillLabels.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}

          {allowManageMembers ? (
            <div className="flex justify-start gap-2 pt-1">
              {allowRoleManagement ? (
                <Button type="button" variant="outline" size="sm" onClick={() => onEdit(member)} className="h-9 rounded-full border-white/10 bg-white/5 px-4 text-white hover:bg-white/10">
                  Edit
                </Button>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={() => onRemove(member)} className="h-9 rounded-full border-red-400/15 bg-red-500/10 px-4 text-red-100 hover:bg-red-500/20">
                Remove
              </Button>
            </div>
          ) : (
            <p className="text-sm text-white/50">No reassignment recommendation at this time.</p>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-0.5 text-base font-semibold leading-none text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: "AVAILABLE" | "HEALTHY" | "BUSY" | "OVERLOADED" }) {
  const tone = {
    AVAILABLE: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    HEALTHY: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    BUSY: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    OVERLOADED: "border-red-400/20 bg-red-500/10 text-red-100",
  } as const;

  const label = {
    AVAILABLE: "Available",
    HEALTHY: "Healthy",
    BUSY: "Busy",
    OVERLOADED: "Overloaded",
  } as const;

  return (
    <span className={`mt-2 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone[status]}`}>
      <span
        className={`mr-1.5 inline-block size-1.5 rounded-full ${
          status === "OVERLOADED"
            ? "bg-red-400"
            : status === "BUSY"
              ? "bg-amber-400"
              : status === "AVAILABLE"
                ? "bg-emerald-400"
                : "bg-blue-400"
        }`}
      />
      {label[status]}
    </span>
  );
}



function WorkloadAnalysisSection({
  analysis,
  isLoading,
  onViewAllRecommendations,
}: {
  analysis: {
    status: "IMBALANCED" | "BALANCED";
    projectHealth: number;
    members: Array<{
      memberId: string;
      name: string;
      workload: number;
      calendarHours: number;
      activeTasks: number;
      inProgressTasks: number;
      pendingTasks: number;
      completedTasks: number;
      utilization: number;
      status: "AVAILABLE" | "HEALTHY" | "BUSY" | "OVERLOADED";
    }>;
    recommendations: Array<{ taskId: string; taskTitle: string; from: string; to: string; priority?: "HIGH" | "MEDIUM" | "LOW"; confidence?: "HIGH" | "MEDIUM" | "LOW"; reason: string[] }>;
  } | null;
  isLoading: boolean;
  onViewAllRecommendations: () => void;
}) {
  const members = analysis?.members ?? [];
  const overloadedMembers = members.filter((member) => member.status === "OVERLOADED");
  const availableMembers = members.filter((member) => member.status === "AVAILABLE");
  const status = analysis?.status ?? null;
  const displayStatus = overloadedMembers.length > 0 ? "OVERLOADED" : status;
  const projectHealth = analysis?.projectHealth ?? null;
  const recommendations = analysis?.recommendations ?? [];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-white">
        <AlertTriangle className={`size-4 ${displayStatus === "OVERLOADED" || displayStatus === "IMBALANCED" ? "text-amber-300" : "text-emerald-300"}`} />
        <p className="text-sm font-medium">AI Workload Analysis</p>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-white/50">Analyzing workload balance...</p>
      ) : (
        <div className="mt-3 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {displayStatus ? (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  displayStatus === "OVERLOADED" || displayStatus === "IMBALANCED"
                    ? "border-amber-400/20 bg-amber-500/10 text-amber-100"
                    : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                }`}
              >
                {displayStatus === "OVERLOADED" ? "Workload Overloaded" : displayStatus === "IMBALANCED" ? "Workload Imbalance Detected" : "Workload Balanced"}
              </span>
            ) : null}
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              Project health {projectHealth ?? "—"}%
            </span>
            {analysis ? (
              <>
                <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs text-red-100">
                  Overloaded members {overloadedMembers.length}
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-100">
                  Available members {availableMembers.length}
                </span>
              </>
            ) : null}
          </div>

          {displayStatus === "OVERLOADED" ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
              One or more members are overloaded. Review the recommendation below.
            </div>
          ) : null}

                    <div className="grid gap-3 md:grid-cols-2">
            {members.map((member) => (
              <div key={member.memberId} className="flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4 text-white/80 transition hover:border-white/15 hover:bg-white/[0.05]">
                <span className="block font-semibold text-lg text-white">{member.name}</span>
                <StatusBadge status={member.status} />

                <ul className="mt-3 space-y-1 text-sm text-white/70">
                  <li>- Utilization: {Math.round(member.utilization)}%</li>
                  <li>- Active Tasks: {member.activeTasks}</li>
                  <li>- Pending Tasks: {member.pendingTasks}</li>
                  <li>- Completed Tasks: {member.completedTasks}</li>
                </ul>
              </div>
            ))}
          </div>

{recommendations.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Recommended reassignment</p>
              {recommendations.slice(0, 2).map((recommendation) => (
                <RecommendationCard key={recommendation.taskId} recommendation={recommendation} />
              ))}
              {recommendations.length > 2 ? (
                <button
                  type="button"
                  onClick={onViewAllRecommendations}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  View All Recommendations ({recommendations.length})
                  <ChevronRight className="size-4" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("") || "?";
}

function formatRoleLabel(role: string) {
  return role
    .trim()
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getMemberSkillLabels(member: ProjectMember) {
  if (Array.isArray(member.skills) && member.skills.length > 0) {
    return member.skills.filter((skill): skill is string => typeof skill === "string" && skill.trim().length > 0);
  }

  if (Array.isArray(member.memberSkills) && member.memberSkills.length > 0) {
    return member.memberSkills
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (entry && typeof entry === "object") {
          const skill = entry as { skill?: { name?: string | null }; name?: string | null };
          return skill.skill?.name ?? skill.name ?? null;
        }

        return null;
      })
      .filter((skill): skill is string => typeof skill === "string" && skill.trim().length > 0);
  }

  return [];
}

export { ProjectInsightsCard };








