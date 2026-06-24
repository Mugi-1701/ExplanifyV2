"use client";

import { useMemo } from "react";
import { Activity, FolderPlus, UserPlus, UserRoundCheck, CheckCircle2, Plus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEventTime } from "@/components/events/utils/format-event-time";
import type { ProjectMember, ProjectWithStats } from "@/types/project";
import type { Task } from "@/types/task";

type RecentActivityFeedProps = {
  project: ProjectWithStats | null;
  tasks: Task[];
};

type ActivityType = "PROJECT_CREATED" | "TASK_CREATED" | "TASK_ASSIGNED" | "TASK_COMPLETED" | "MEMBER_ADDED";

type ActivityItem = {
  id: string;
  type: ActivityType;
  userName: string;
  action: string;
  entityName: string;
  createdAt: string;
};

function RecentActivityFeed({ project, tasks }: RecentActivityFeedProps) {
  const activities = useMemo(() => buildRecentActivities(project, tasks), [project, tasks]);

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Workspace Activity</p>
            <CardTitle className="mt-1 text-xl text-white">Recent Activity</CardTitle>
            <CardDescription className="text-white/60">Latest project, task, and member activity from the active workspace.</CardDescription>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 p-2 text-white/60">
            <Activity className="size-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/55">
            Activity will appear here once the workspace has projects, tasks, or members.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const Icon = getActivityIcon(activity.type);

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl border ${getTone(activity.type)}`}>
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{`${activity.userName} ${activity.action} ${activity.entityName}`}</p>
              <p className="mt-0.5 text-sm leading-5 text-white/60">{activity.type === "MEMBER_ADDED" ? "Workspace membership updated." : "Recent workspace activity."}</p>
            </div>
            <time className="shrink-0 text-xs text-white/40" dateTime={activity.createdAt}>
              {formatEventTime(activity.createdAt)}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
}

function buildRecentActivities(project: ProjectWithStats | null, tasks: Task[]): ActivityItem[] {
  const projectName = project?.name ?? "Project";
  const memberLookup = new Map((project?.members ?? []).map((member) => [member.userId, member]));

  const activities: ActivityItem[] = [];

  if (project?.createdAt) {
    activities.push({
      id: `project:${project.id}`,
      type: "PROJECT_CREATED",
      userName: resolveMemberName(project.owner?.name ?? null, project.ownerId ?? null, memberLookup),
      action: "created project",
      entityName: `"${projectName}"`,
      createdAt: project.createdAt,
    });
  }

  for (const task of tasks) {
    if (task.createdAt) {
      activities.push({
        id: `task-created:${task.id}`,
        type: "TASK_CREATED",
        userName: resolveActorName(task.assignee?.name ?? null, project),
        action: "created task",
        entityName: `"${task.title}"`,
        createdAt: task.createdAt,
      });
    }

    if (task.assigneeId && task.assignee?.name) {
      activities.push({
        id: `task-assigned:${task.id}:${task.assigneeId}`,
        type: "TASK_ASSIGNED",
        userName: resolveActorName(task.assignee?.name ?? null, project),
        action: "assigned task",
        entityName: `"${task.title}"`,
        createdAt: task.updatedAt ?? task.createdAt ?? new Date().toISOString(),
      });
    }

    if (task.status === "DONE") {
      activities.push({
        id: `task-completed:${task.id}`,
        type: "TASK_COMPLETED",
        userName: resolveActorName(task.assignee?.name ?? null, project),
        action: "completed task",
        entityName: `"${task.title}"`,
        createdAt: task.updatedAt ?? task.createdAt ?? new Date().toISOString(),
      });
    }
  }

  for (const member of project?.members ?? []) {
    activities.push({
      id: `member-added:${member.id}`,
      type: "MEMBER_ADDED",
      userName: resolveMemberName(member.user?.name ?? null, member.userId, memberLookup),
      action: "added member",
      entityName: member.user?.name ? `"${member.user.name}"` : "to workspace",
      createdAt: member.createdAt ?? project?.createdAt ?? new Date().toISOString(),
    });
  }

  return activities
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5);
}

function resolveMemberName(name: string | null, userId: string | null | undefined, memberLookup: Map<string, ProjectMember>) {
  if (name) return name;
  if (userId && memberLookup.has(userId)) {
    return memberLookup.get(userId)?.user?.name ?? "Member";
  }
  return "Member";
}

function resolveActorName(taskAssigneeName: string | null, project: ProjectWithStats | null) {
  return taskAssigneeName ?? project?.owner?.name ?? "Team";
}

function getActivityIcon(type: ActivityType) {
  switch (type) {
    case "PROJECT_CREATED":
      return FolderPlus;
    case "TASK_CREATED":
      return Plus;
    case "TASK_ASSIGNED":
      return UserRoundCheck;
    case "TASK_COMPLETED":
      return CheckCircle2;
    case "MEMBER_ADDED":
      return UserPlus;
    default:
      return Activity;
  }
}

function getTone(type: ActivityType) {
  switch (type) {
    case "PROJECT_CREATED":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200";
    case "TASK_CREATED":
      return "border-violet-400/20 bg-violet-500/10 text-violet-100";
    case "TASK_ASSIGNED":
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
    case "TASK_COMPLETED":
      return "border-blue-400/20 bg-blue-500/10 text-blue-200";
    case "MEMBER_ADDED":
      return "border-cyan-400/20 bg-cyan-500/10 text-cyan-100";
    default:
      return "border-white/10 bg-white/5 text-white/65";
  }
}

export { RecentActivityFeed };
