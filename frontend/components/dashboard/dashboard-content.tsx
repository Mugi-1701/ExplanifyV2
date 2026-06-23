"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users } from "lucide-react";

import { DashboardErrorCard } from "@/components/dashboard/dashboard-error-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjectDisplayName } from "@/hooks/use-project-display-name";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/task";

type DashboardContentProps = {
  projectId?: string;
};

function deriveCoordinationStatus(tasks: Task[]) {
  if (tasks.some((task) => task.isBlocked)) {
    return { value: "Blocked", description: "At least one task is waiting on dependencies.", accent: "amber" as const };
  }

  if (tasks.some((task) => task.status === "IN_PROGRESS")) {
    return { value: "Active", description: "Tasks are currently progressing through the pipeline.", accent: "blue" as const };
  }

  if (tasks.length > 0) {
    return { value: "Ready", description: "All loaded tasks are coordinated and ready to move.", accent: "emerald" as const };
  }

  return { value: "Idle", description: "No tasks were returned for the selected project.", accent: "violet" as const };
}

function DashboardContent({ projectId }: DashboardContentProps) {
  const { tasks, loading, error, refetch } = useTasks(projectId);
  const projectName = useProjectDisplayName(projectId);

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  if (!projectId) {
    return (
      <PageContainer size="wide">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="hidden-scrollbar space-y-8">
          <SectionHeader
            eyebrow="AI-Native SaaS Dashboard"
            title="Coordinate work with explainable AI."
            description="Select or create a project to start monitoring blocked tasks, dependency chains, and execution readiness."
            action={<Badge variant="purple" className="border-violet-400/20 bg-violet-500/10 text-violet-100">No active project</Badge>}
          />
          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="No project selected"
            description="The dashboard needs an active project to load task data."
            detail="Create a project or pick one from Projects to see live coordination signals."
          />
        </motion.div>
      </PageContainer>
    );
  }

  if (loading && safeTasks.length === 0) {
    return <DashboardSkeleton />;
  }

  if (error && safeTasks.length === 0) {
    return <DashboardErrorCard message={error} onRetry={() => void refetch()} />;
  }

  const totalTasks = safeTasks.length;
  const completedTasks = safeTasks.filter((task) => task.status === "DONE").length;
  const blockedTasks = safeTasks.filter((task) => task.isBlocked).length;
  const coordinationStatus = deriveCoordinationStatus(safeTasks);
  const blockedTaskItems = safeTasks.filter((task) => task.isBlocked);

  return (
    <PageContainer size="wide">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="hidden-scrollbar space-y-8">
        <SectionHeader
          eyebrow="AI-Native SaaS Dashboard"
          title="Coordinate work with explainable AI."
          description="Monitor blocked tasks, dependency chains, and execution readiness from one premium command center."
          action={<Badge variant="purple" className="border-violet-400/20 bg-violet-500/10 text-violet-100">Project: {projectName}</Badge>}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Tasks"
            value={String(totalTasks)}
            description="Tasks returned from the live backend for the selected project."
            accent="violet"
          />
          <StatCard
            label="Completed Tasks"
            value={String(completedTasks)}
            description="Tasks already marked as DONE in Explanify."
            accent="emerald"
          />
          <StatCard
            label="Blocked Tasks"
            value={String(blockedTasks)}
            description="Tasks currently waiting on incomplete dependencies."
            accent="amber"
          />
          <StatCard
            label="AI Coordination Status"
            value={coordinationStatus.value}
            description={coordinationStatus.description}
            accent={coordinationStatus.accent}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <Card className="space-y-6 border-white/10 bg-white/[0.03] p-5 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Workspace Overview</p>
                <h2 className="mt-1 text-xl font-semibold text-white">Coordination signals</h2>
              </div>
              <Badge variant="blue" className="border-blue-400/20 bg-blue-500/10 text-blue-100">
                Dependency-aware
              </Badge>
            </div>

            {totalTasks === 0 ? (
              <EmptyState
                icon={<Sparkles className="size-5" />}
                title="No tasks loaded"
                description="Load a project to see live coordination health."
                detail="Once tasks arrive, the dashboard will surface blocked items, dependency signals, and AI explanations in the same layout."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/55">Task health</p>
                  <div className="mt-3 text-4xl font-semibold text-white">
                    {Math.round(((completedTasks + Math.max(totalTasks - blockedTasks - completedTasks, 0)) / totalTasks) * 100)}%
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/60">Derived from completed, blocked, and active tasks in the live backend.</p>
                </motion.div>

                <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm text-white/55">Coordination latency</p>
                  <div className="mt-3 text-4xl font-semibold text-white">Live</div>
                  <p className="mt-2 text-sm leading-6 text-white/60">AI coordination explanations are rendered from real task dependency states.</p>
                </motion.div>
              </div>
            )}
          </Card>

          <Card className="relative h-full overflow-hidden border-violet-500/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),rgba(255,255,255,0.05)]">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.12),transparent_42%,rgba(59,130,246,0.08))]" />
            <CardHeader className="relative space-y-3 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/15 text-violet-200 shadow-[0_0_30px_rgba(168,85,247,0.28)]">
                  <Users className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Coordination</CardTitle>
                  <CardDescription>Explainable task intelligence for dependency-aware execution.</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="purple" className="border-violet-400/20 bg-violet-500/10 text-violet-100">
                  Live coordination
                </Badge>
                <Badge variant="success">{blockedTaskItems.length} blocked</Badge>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-5">
              <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 size-5 text-amber-300" />
                  <div>
                    <p className="text-sm font-medium text-white">Blocked tasks detected</p>
                    <p className="mt-1 text-sm leading-6 text-white/65">
                      The coordination engine is scanning dependencies and explaining why work cannot proceed yet.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {blockedTaskItems.length > 0 ? (
                    blockedTaskItems.map((task) => (
                      <div key={task.id} className="space-y-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-white">{task.title}</p>
                            <p className="text-sm text-white/55">{task.coordinationReason ?? "Waiting on dependencies"}</p>
                          </div>
                          <Badge variant="warning">{task.isBlocked ? "BLOCKED" : "READY"}</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
                      All tasks are coordinated. No dependencies are blocking execution right now.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </motion.div>
    </PageContainer>
  );
}

export { DashboardContent };
