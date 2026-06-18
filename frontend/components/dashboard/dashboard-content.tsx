"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { DashboardErrorCard } from "@/components/dashboard/dashboard-error-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { AICoordinationCard } from "@/components/dashboard/ai-coordination-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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

  const safeTasks = Array.isArray(tasks) ? tasks : [];

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
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="space-y-8">
        <SectionHeader
          eyebrow="AI-Native SaaS Dashboard"
          title="Coordinate work with explainable AI."
          description="Monitor blocked tasks, dependency chains, and execution readiness from one premium command center."
          action={<Badge variant="purple" className="border-violet-400/20 bg-violet-500/10 text-violet-100">Project: {projectId ?? "Active project"}</Badge>}
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

          <AICoordinationCard tasks={blockedTaskItems} />
        </section>
      </motion.div>
    </PageContainer>
  );
}

export { DashboardContent };
