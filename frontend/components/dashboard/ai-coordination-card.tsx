"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Bot, CircleCheckBig, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Task } from "@/types/task";

type AICoordinationCardProps = {
  tasks: Task[];
};

function AICoordinationCard({ tasks }: AICoordinationCardProps) {
  const blockedTasks = tasks.filter((task) => task.isBlocked);
  const totalBlockingDependencies = blockedTasks.reduce((total, task) => total + (task.blockingTasks?.length ?? 0), 0);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="h-full"
    >
      <Card className="relative h-full overflow-hidden border-violet-500/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_28%),rgba(255,255,255,0.05)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.12),transparent_42%,rgba(59,130,246,0.08))]" />
        <CardHeader className="relative space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/15 text-violet-200 shadow-[0_0_30px_rgba(168,85,247,0.28)]">
              <Bot className="size-5" />
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
            <Badge variant="success">{tasks.filter((task) => task.status === "DONE").length} done</Badge>
            <Badge variant="warning">{blockedTasks.length} blocked</Badge>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-5">
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 text-amber-300" />
              <div>
                <p className="text-sm font-medium text-white">Blocked tasks detected</p>
                <p className="mt-1 text-sm leading-6 text-white/65">
                  The coordination engine is scanning dependencies and explaining why work cannot proceed yet.
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              {blockedTasks.length > 0 ? (
                blockedTasks.map((task) => (
                  <div key={task.id} className="space-y-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <p className="text-sm text-white/55">{task.coordinationReason ?? "Waiting on dependencies"}</p>
                      </div>
                      <Badge variant="warning">{task.isBlocked ? "BLOCKED" : "READY"}</Badge>
                    </div>

                    <div className="rounded-lg border border-blue-400/15 bg-blue-500/10 p-3 text-xs text-white/70">
                      <p className="mb-2 font-medium text-blue-100">Dependency state</p>
                      <div className="space-y-1.5">
                        {(task.blockingTasks ?? []).map((blockingTask) => (
                          <div key={blockingTask.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 px-3 py-2">
                            <span>{blockingTask.title}</span>
                            <span className="text-white/45">{blockingTask.status}</span>
                          </div>
                        ))}
                      </div>
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

          <div className="grid gap-3 rounded-2xl border border-blue-400/15 bg-blue-500/10 p-4 text-sm text-white/75">
            <div className="flex items-center gap-2 text-blue-200">
              <Sparkles className="size-4" />
              Coordination Explanation
            </div>
            <p className="leading-6">
              {blockedTasks.length > 0
                ? `Waiting for ${blockedTasks[0]?.blockingTasks?.[0]?.title ?? "dependencies"}`
                : "All dependencies satisfied."}
            </p>
            <div className="flex items-center gap-2 text-emerald-300">
              <CircleCheckBig className="size-4" />
              {totalBlockingDependencies > 0
                ? `${totalBlockingDependencies} dependency${totalBlockingDependencies === 1 ? " is" : "ies are"} still influencing task flow.`
                : "Task flow is clear and execution can proceed."}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { AICoordinationCard };
