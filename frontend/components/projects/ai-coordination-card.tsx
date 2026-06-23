"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BadgeCheck, CircleGauge, Loader2, Users } from "lucide-react";

import { getWorkloadOverview } from "@/services/ai.service";
import type { AIWorkloadMember } from "@/types/ai";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AICoordinationCardProps = {
  projectId?: string | null;
};

function getStatusClasses(status: AIWorkloadMember["status"]) {
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

function getProgressClass(status: AIWorkloadMember["status"]) {
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

function WorkloadRow({ member }: { member: AIWorkloadMember }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="font-semibold text-white">{member.memberName}</p>
          <div className="flex items-center gap-3 text-sm text-white/55">
            <span>{member.activeTasks} active tasks</span>
            <span>{member.calendarHours} scheduled hours</span>
          </div>
        </div>
        <Badge className={cn("rounded-full border px-3 py-1 text-xs font-medium", getStatusClasses(member.status))}>{member.status}</Badge>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-white/55">
          <span>Utilization</span>
          <span>{Math.round(member.utilization)}%</span>
        </div>
        <Progress value={member.utilization} className="bg-white/10" indicatorClassName={getProgressClass(member.status)} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-white/55">{helper}</p>
    </div>
  );
}

function AICoordinationCard({ projectId }: AICoordinationCardProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ai-workload", projectId],
    queryFn: () => getWorkloadOverview(projectId ?? ""),
    enabled: Boolean(projectId),
  });

  const members = Array.isArray(data) ? data : [];

  const summary = useMemo(() => {
    const totalMembers = members.length;
    const overloadedMembers = members.filter((member) => member.status === "OVERLOADED").length;
    const availableMembers = members.filter((member) => member.status === "AVAILABLE").length;
    const averageUtilization = totalMembers > 0 ? members.reduce((sum, member) => sum + member.utilization, 0) / totalMembers : 0;

    return {
      totalMembers,
      overloadedMembers,
      availableMembers,
      averageUtilization,
    };
  }, [members]);

  const insight = useMemo(() => {
    if (summary.overloadedMembers > 0) {
      return `${summary.overloadedMembers} team member${summary.overloadedMembers === 1 ? " is" : "s are"} overloaded and may require workload redistribution.`;
    }

    if (summary.averageUtilization > 75) {
      return "Team workload is approaching capacity.";
    }

    return "Team workload distribution appears healthy.";
  }, [summary.averageUtilization, summary.overloadedMembers]);

  if (!projectId) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-xl">AI Coordination</CardTitle>
          <CardDescription>Select a project to view team workload.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="space-y-3">
          <Skeleton className="h-5 w-40 bg-white/10" />
          <Skeleton className="h-4 w-64 bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl bg-white/10" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-2xl bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-400/15 bg-red-500/10">
        <CardHeader>
          <div className="flex items-center gap-3 text-red-100">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/15">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">AI Coordination</CardTitle>
              <CardDescription className="text-white/65">We could not load workload data right now.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
          >
            <Loader2 className="size-4" />
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-violet-500/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_26%),rgba(255,255,255,0.04)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.08),transparent_40%,rgba(59,130,246,0.06))]" />
      <CardHeader className="relative space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/15 text-violet-200 shadow-[0_0_30px_rgba(168,85,247,0.28)]">
            <CircleGauge className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl">AI Coordination</CardTitle>
            <CardDescription>Team workload overview from live project data.</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="purple" className="border-violet-400/20 bg-violet-500/10 text-violet-100">
            Live workload
          </Badge>
          <Badge variant="muted" className="text-white/70">
            {members.length} members
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="hidden-scrollbar relative space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Members" value={String(summary.totalMembers)} helper="Loaded from the AI workload endpoint." />
          <MetricCard label="Overloaded Members" value={String(summary.overloadedMembers)} helper="Members above the overloaded threshold." />
          <MetricCard label="Available Members" value={String(summary.availableMembers)} helper="Members ready to take on more work." />
          <MetricCard label="Average Utilization" value={`${Math.round(summary.averageUtilization)}%`} helper="Teamwide workload density." />
        </div>

        <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-4 text-sm text-white/75">
          <div className="flex items-center gap-2 text-blue-200">
            <BadgeCheck className="size-4" />
            Coordination insight
          </div>
          <p className="mt-2 leading-6">{insight}</p>
        </div>

        {members.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">No workload data available.</div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <WorkloadRow key={member.memberId} member={member} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { AICoordinationCard };
