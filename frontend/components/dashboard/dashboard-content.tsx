"use client";

import { motion } from "framer-motion";

import { DashboardErrorCard } from "@/components/dashboard/dashboard-error-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { AICoordinationCard } from "@/components/dashboard/ai-coordination-card";
import { StatCard } from "@/components/dashboard/stat-card";
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

  if (process.env.NODE_ENV !== "production") {
    console.debug("DASHBOARD RENDER", { projectId, loading, error, taskCount: safeTasks.length });
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
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="space-y-8 px-4 py-6 md:px-8 md:py-8"
    >
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.22em] text-violet-200/80">AI-Native SaaS Dashboard</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
              Coordinate work with explainable AI.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-white/65 md:text-base">
              Monitor blocked tasks, dependency chains, and execution readiness from one premium command center.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
            Project: <span className="text-white">{projectId ?? "Active project"}</span>
          </div>
        </div>
      </section>

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
        <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_30px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl md:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Workspace Overview</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Coordination signals</h2>
            </div>
            <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100">
              Dependency-aware
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/55">Task health</p>
              <div className="mt-3 text-4xl font-semibold text-white">
                {totalTasks === 0 ? "—" : `${Math.round(((completedTasks + Math.max(totalTasks - blockedTasks - completedTasks, 0)) / totalTasks) * 100)}%`}
              </div>
              <p className="mt-2 text-sm leading-6 text-white/60">
                {totalTasks === 0
                  ? "Load a project to see live coordination health."
                  : "Derived from completed, blocked, and active tasks in the live backend."}
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm text-white/55">Coordination latency</p>
              <div className="mt-3 text-4xl font-semibold text-white">Live</div>
              <p className="mt-2 text-sm leading-6 text-white/60">AI coordination explanations are rendered from real task dependency states.</p>
            </motion.div>
          </div>
        </div>

        <AICoordinationCard tasks={blockedTaskItems} />
      </section>
    </motion.div>
  );
}

export { DashboardContent };
