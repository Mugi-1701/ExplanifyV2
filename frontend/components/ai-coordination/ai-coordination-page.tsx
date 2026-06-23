"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeAlert, Brain, Clock3, Sparkles, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/useTasks";
import { useProjectDisplayName } from "@/hooks/use-project-display-name";
import { useActivityTimeline } from "@/components/events/hooks/use-activity-timeline";
import type { EventLog } from "@/components/events/types";
import { formatEventTime } from "@/components/events/utils/format-event-time";
import { getWorkloadOverview } from "@/services/ai.service";
import type { AIWorkloadMember } from "@/types/ai";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-errors";

type AiCoordinationPageProps = {
  projectId?: string;
};

type CoordinationTimelineItem = {
  id: string;
  title: string;
  status: string;
  timestamp: string;
  source: "live" | "demo";
};

function statusTone(status: AIWorkloadMember["status"]) {
  switch (status) {
    case "AVAILABLE":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
    case "HEALTHY":
      return "border-blue-400/20 bg-blue-500/10 text-blue-100";
    case "BUSY":
      return "border-amber-400/20 bg-amber-500/10 text-amber-100";
    case "OVERLOADED":
      return "border-red-400/20 bg-red-500/10 text-red-100";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function progressTone(status: AIWorkloadMember["status"]) {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-400";
    case "HEALTHY":
      return "bg-blue-400";
    case "BUSY":
      return "bg-amber-400";
    case "OVERLOADED":
      return "bg-red-400";
    default:
      return "bg-violet-400";
  }
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-white/45">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
        <p className="mt-2 text-sm leading-6 text-white/55">{detail}</p>
      </CardContent>
    </Card>
  );
}

function WorkloadMatrixRow({ member }: { member: AIWorkloadMember }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-white">{member.memberName}</p>
          <p className="mt-1 text-sm text-white/55">{member.activeTasks} active tasks Â· {member.calendarHours} scheduled hours</p>
        </div>
        <Badge className={cn("rounded-full border px-3 py-1 text-xs font-medium", statusTone(member.status))}>{member.status}</Badge>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-white/55">
          <span>Utilization</span>
          <span>{Math.round(member.utilization)}%</span>
        </div>
        <Progress
          value={member.utilization}
          className="bg-white/10"
          indicatorClassName={progressTone(member.status)}
        />
      </div>
    </div>
  );
}

function TimelineBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.16em] text-violet-100">{label}</span>;
}

function getCoordinationEventTitle(event: EventLog, taskTitles: Record<string, string>, memberNames: Record<string, string>) {
  const metadata = event.metadata ?? {};
  const taskTitle =
    (typeof metadata.taskTitle === "string" && metadata.taskTitle) ||
    taskTitles[event.entityId] ||
    (typeof metadata.title === "string" && metadata.title) ||
    "Task";
  const memberName =
    (typeof metadata.memberName === "string" && metadata.memberName) ||
    (typeof metadata.assigneeName === "string" && metadata.assigneeName) ||
    memberNames[event.userId ?? ""] ||
    "team member";

  switch (event.eventType) {
    case "TASK_ASSIGNED":
      return `${taskTitle} assigned to ${memberName}`;
    case "TASK_UPDATED":
      return `${taskTitle} updated`;
    case "TASK_COMPLETED":
      return `${taskTitle} marked complete`;
    case "TASK_CREATED":
      return `${taskTitle} created`;
    case "MEMBER_ADDED":
      return `${memberName} joined the project`;
    case "MEMBER_REMOVED":
      return `${memberName} removed from the project`;
    case "PROJECT_UPDATED":
      return `${taskTitle} project updated`;
    default:
      return `${taskTitle} activity recorded`;
  }
}

function getCoordinationEventStatus(event: EventLog) {
  switch (event.eventType) {
    case "TASK_ASSIGNED":
      return "ASSIGNED";
    case "TASK_UPDATED":
      return "UPDATED";
    case "TASK_COMPLETED":
      return "DONE";
    case "TASK_CREATED":
      return "CREATED";
    case "MEMBER_ADDED":
    case "MEMBER_REMOVED":
      return "MEMBER";
    case "PROJECT_UPDATED":
      return "PROJECT";
    default:
      return "ACTIVE";
  }
}

function buildFallbackCoordinationEvents() {
  const now = Date.now();
  return [
    { id: "demo-1", title: "Authentication unblocked Testing", status: "UNBLOCKED", timestamp: new Date(now - 60_000).toISOString(), source: "demo" as const },
    { id: "demo-2", title: "Database Design moved to IN_PROGRESS", status: "IN_PROGRESS", timestamp: new Date(now - 3 * 60_000).toISOString(), source: "demo" as const },
    { id: "demo-3", title: "API Development assigned to Naveen", status: "ASSIGNED", timestamp: new Date(now - 8 * 60_000).toISOString(), source: "demo" as const },
    { id: "demo-4", title: "Queue Management API waiting for API Development", status: "WAITING", timestamp: new Date(now - 13 * 60_000).toISOString(), source: "demo" as const },
    { id: "demo-5", title: "Frontend Integration marked BLOCKED", status: "BLOCKED", timestamp: new Date(now - 19 * 60_000).toISOString(), source: "demo" as const },
  ];
}

function AiCoordinationPage({ projectId }: AiCoordinationPageProps) {
  const projectName = useProjectDisplayName(projectId);
  const { tasks, loading: tasksLoading, error: tasksError } = useTasks(projectId);
  const { events: coordinationEvents } = useActivityTimeline("project", projectId);
  const { data: workloadMembers, isLoading: workloadLoading, error: workloadQueryError } = useQuery({
    queryKey: ["ai-workload", projectId],
    queryFn: () => getWorkloadOverview(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const members = Array.isArray(workloadMembers) ? workloadMembers : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const summary = useMemo(() => {
    const totalMembers = members.length;
    const availableMembers = members.filter((member) => member.status === "AVAILABLE").length;
    const busyMembers = members.filter((member) => member.status === "BUSY").length;
    const overloadedMembers = members.filter((member) => member.status === "OVERLOADED").length;
    const averageUtilization = totalMembers > 0 ? members.reduce((sum, member) => sum + member.utilization, 0) / totalMembers : 0;

    return {
      totalMembers,
      availableMembers,
      busyMembers,
      overloadedMembers,
      averageUtilization,
    };
  }, [members]);

  const recommendationActivity = useMemo(() => {
    return safeTasks
      .filter((task) => task.aiRecommendationScore !== undefined && task.aiRecommendationScore !== null)
      .sort((a, b) => Number(new Date(b.updatedAt ?? b.createdAt ?? 0)) - Number(new Date(a.updatedAt ?? a.createdAt ?? 0)))
      .slice(0, 6);
  }, [safeTasks]);

  const activeDependencies = useMemo(() => safeTasks.reduce((count, task) => count + (task.dependencies?.length ?? 0), 0), [safeTasks]);

  const taskTitleMap = useMemo(() => Object.fromEntries(safeTasks.map((task) => [task.id, task.title])), [safeTasks]);
  const memberNameMap = useMemo(() => Object.fromEntries(members.map((member) => [member.memberId, member.memberName])), [members]);

  const coordinationTimeline = useMemo(() => {
    if (coordinationEvents.length > 0) {
      return coordinationEvents.slice(0, 5).map((event): CoordinationTimelineItem => ({
        id: event.id,
        title: getCoordinationEventTitle(event, taskTitleMap, memberNameMap),
        status: getCoordinationEventStatus(event),
        timestamp: event.createdAt,
        source: "live" as const,
      }));
    }

    return buildFallbackCoordinationEvents() as CoordinationTimelineItem[];
  }, [coordinationEvents, memberNameMap, taskTitleMap]);

  const insights = useMemo(() => {
    const items: string[] = [];

    const overloaded = members.filter((member) => member.status === "OVERLOADED");
    const available = members.filter((member) => member.status === "AVAILABLE");
    const average = summary.averageUtilization;

    if (overloaded.length > 0) {
      items.push(`${overloaded[0].memberName} is overloaded.`);
    }

    if (available.length > 0) {
      items.push(`${available[0].memberName} has available capacity.`);
    }

    if (average <= 75) {
      items.push("Team workload is healthy.");
    } else {
      items.push("Team workload is approaching capacity.");
    }

    return items;
  }, [members, summary.averageUtilization]);

  if (!projectId) {
    return (
      <PageContainer size="wide">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="hidden-scrollbar space-y-8">
          <SectionHeader
            eyebrow="AI Coordination Module"
            title="A dedicated control center for team workload intelligence."
            description="Pick an active project to unlock workload analytics, coordination insights, and recommendation history."
            action={<Badge variant="purple" className="border-violet-400/20 bg-violet-500/10 text-violet-100">No active project</Badge>}
          />

          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="No active project selected"
            description="AI Coordination needs a project context to load workload data."
            detail="Switch to a project from the sidebar or Projects to see live team utilization."
          />
        </motion.div>
      </PageContainer>
    );
  }

  if ((tasksLoading && safeTasks.length === 0) || (workloadLoading && members.length === 0)) {
    return (
      <PageContainer size="wide">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="hidden-scrollbar space-y-8">
          <SectionHeader
            eyebrow="AI Coordination Module"
            title="A dedicated control center for team workload intelligence."
            description="Loading live workload and task signals."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-3xl bg-white/10" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-5 w-40 bg-white/10" />
                <Skeleton className="h-24 w-full bg-white/10" />
                <Skeleton className="h-24 w-full bg-white/10" />
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-5 w-44 bg-white/10" />
                <Skeleton className="h-24 w-full bg-white/10" />
                <Skeleton className="h-24 w-full bg-white/10" />
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </PageContainer>
    );
  }

  if ((tasksError && safeTasks.length === 0) || (workloadQueryError && members.length === 0)) {
    return (
      <PageContainer size="wide">
        <Card className="border-red-400/15 bg-red-500/10">
          <CardHeader>
            <div className="flex items-center gap-3 text-red-100">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/15">
                <BadgeAlert className="size-5" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">AI Coordination unavailable</CardTitle>
                <CardDescription className="text-white/65">We could not load the module right now.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm leading-6 text-white/70">{getApiErrorMessage(tasksError ?? workloadQueryError, "Unable to load AI coordination data.")}</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="wide">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="hidden-scrollbar space-y-8">
        <SectionHeader
          eyebrow="AI Coordination Module"
          title="Command center for team utilization and AI assistance."
          description="Monitor live workload, identify capacity changes, and review recent AI recommendation activity from one standalone module."
          action={
            <Badge variant="purple" className="border-violet-400/20 bg-violet-500/10 text-violet-100">
              Project: {projectName}
            </Badge>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Total Members" value={String(summary.totalMembers)} detail="Members surfaced by the workload endpoint." />
          <MetricCard label="Available Members" value={String(summary.availableMembers)} detail="Ready to accept additional work." />
          <MetricCard label="Busy Members" value={String(summary.busyMembers)} detail="Operating with significant load." />
          <MetricCard label="Overloaded Members" value={String(summary.overloadedMembers)} detail="Members that may need redistribution." />
          <MetricCard label="Average Utilization" value={`${Math.round(summary.averageUtilization)}%`} detail="Teamwide capacity trend." />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Workload Matrix</CardTitle>
                  <CardDescription>Member-level utilization and capacity posture.</CardDescription>
                </div>
                <Badge variant="blue" className="border-blue-400/20 bg-blue-500/10 text-blue-100">
                  Live data
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">No workload data available.</div>
              ) : (
                members.map((member) => <WorkloadMatrixRow key={member.memberId} member={member} />)
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/15 text-violet-200">
                    <Brain className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Insights</CardTitle>
                    <CardDescription>Generated from live workload data.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.map((insight) => (
                  <div key={insight} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                    <Sparkles className="mt-0.5 size-4 text-violet-300" />
                    <p className="leading-6">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/15 text-blue-200">
                    <Clock3 className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Recommendation Activity</CardTitle>
                    <CardDescription>Recent AI recommendation results from task records.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendationActivity.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
                    No recent AI recommendation activity.
                  </div>
                ) : (
                  recommendationActivity.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{task.title}</p>
                          <p className="mt-1 text-sm text-white/55">
                            Recommended score {Math.round((task.aiRecommendationScore ?? 0) * 100)}% Â· Confidence{" "}
                            {task.aiRecommendationConfidence ?? "UNKNOWN"}
                          </p>
                        </div>
                        <Badge variant="muted">{task.assignee?.name ?? "Unassigned"}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(task.aiRecommendationExplanation ?? []).slice(0, 3).map((item) => (
                          <Badge key={item} variant="blue" className="border-blue-400/20 bg-blue-500/10 text-blue-100">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="flex items-center gap-2 text-sm text-white/45">
          <ArrowRight className="size-4" />
          Standalone AI Coordination module
        </div>
      </motion.div>
    </PageContainer>
  );
}

export { AiCoordinationPage };
