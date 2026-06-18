"use client";

import { AlertCircle, Link2, TrendingUp, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from "@/types/task";

type CoordinationInsightsProps = {
  tasks: Task[];
};

function CoordinationInsights({ tasks }: CoordinationInsightsProps) {
  const blockedTasks = tasks.filter((task) => task.isBlocked || task.status === "BLOCKED");
  const healthyTasks = tasks.filter((task) => !task.isBlocked && task.status !== "BLOCKED");
  const readyTasks = tasks.filter((task) => task.coordinationState === "READY" && !task.isBlocked);
  const dependencyCount = tasks.reduce((sum, task) => sum + (task.blockingTasks?.length ?? 0) + (task.dependencies?.length ?? 0), 0);

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Zap className="size-5 text-violet-400" />
          AI Coordination Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Healthy</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">{healthyTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Ready</p>
            <p className="mt-2 text-2xl font-semibold text-blue-200">{readyTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Blocked</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">{blockedTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Dependencies</p>
            <p className="mt-2 text-2xl font-semibold text-violet-200">{dependencyCount}</p>
          </div>
        </div>

        {blockedTasks.length > 0 ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4 flex-shrink-0 text-amber-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-100">
                  {blockedTasks.length} task{blockedTasks.length === 1 ? " is" : "s are"} blocked
                </p>
                <p className="mt-1 text-xs text-amber-200/80">These tasks are waiting on dependencies to complete before execution.</p>
                <div className="mt-2 space-y-1">
                  {blockedTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="text-xs text-amber-100/70">
                      - {task.title}
                    </div>
                  ))}
                  {blockedTasks.length > 3 ? <div className="text-xs text-amber-100/50">+{blockedTasks.length - 3} more blocked</div> : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {dependencyCount > 0 ? (
          <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-3">
            <div className="mb-1 flex items-center gap-2">
              <Link2 className="size-4 text-blue-300" />
              <p className="text-sm font-medium text-blue-100">Dependency Chain</p>
            </div>
            <p className="text-xs text-blue-200/80">
              {dependencyCount} total dependency relationship{dependencyCount === 1 ? "" : "s"} detected across all tasks.
            </p>
          </div>
        ) : null}

        {readyTasks.length > 0 ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-300" />
              <p className="text-sm font-medium text-emerald-100">Ready for Execution ({readyTasks.length})</p>
            </div>
            <div className="space-y-1">
              {readyTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-xs text-emerald-100/70">
                  - {task.title}
                </div>
              ))}
              {readyTasks.length > 3 ? <div className="text-xs text-emerald-100/50">+{readyTasks.length - 3} more</div> : null}
            </div>
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
            <p className="text-sm text-white/50">No tasks yet. Create a task to see coordination insights.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { CoordinationInsights };
