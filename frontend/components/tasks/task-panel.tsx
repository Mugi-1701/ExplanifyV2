"use client";

import { motion } from "framer-motion";
import { PencilLine, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Task } from "@/types/task";
import { TaskBadges } from "./task-badges";
import { getTaskDependencyNodes } from "./task-utils";

type TaskPanelProps = {
  task: Task | null;
  onEdit: (task: Task) => void;
};

function TaskPanel({ task, onEdit }: TaskPanelProps) {
  if (!task) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-xl text-white">Task Inspector</CardTitle>
          <CardDescription className="text-white/60">
            Select a task from the table to view detailed information, dependencies, and coordination insights.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const dependencyNodes = getTaskDependencyNodes(task);
  const formattedDate = task.createdAt
    ? new Date(task.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="break-words text-xl text-white">{task.title}</CardTitle>
              <CardDescription className="mt-2 line-clamp-2 text-white/60">
                {task.description || "No description provided."}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="flex-shrink-0 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onEdit(task)}>
              <PencilLine className="mr-2 size-4" />
              Edit
            </Button>
          </div>
          <TaskBadges task={task} />
        </CardHeader>

        <CardContent className="space-y-4 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Created</p>
              <p className="mt-1 text-sm text-white/80">{formattedDate}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">Coordination</p>
              <p className="mt-1 text-sm text-white/80">{task.coordinationState || "READY"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-4">
            <div className="mb-2 flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-blue-300" />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-200">AI Explanation</p>
            </div>
            <p className="text-sm leading-6 text-white/75">{task.coordinationReason || "No AI explanation available yet."}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Dependency State</p>
              {task.isBlocked ? <Badge variant="warning">Blocked</Badge> : <Badge variant="success">Ready</Badge>}
            </div>

            {dependencyNodes.length > 0 ? (
              <div className="space-y-2">
                {dependencyNodes.map((dep) => (
                  <div key={dep.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <span className="truncate text-white">{dep.title}</span>
                    <Badge variant={dep.status === "DONE" ? "success" : dep.status === "BLOCKED" ? "warning" : "muted"} className="text-xs">
                      {dep.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/50">No dependencies. Task can proceed independently.</p>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-white/40">Task Status</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">Current State:</span>
                <Badge variant={task.status === "DONE" ? "success" : task.status === "IN_PROGRESS" ? "blue" : "muted"}>
                  {task.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-white/70">Priority:</span>
                <Badge variant={task.priority === "CRITICAL" ? "destructive" : task.priority === "HIGH" ? "warning" : "muted"}>
                  {task.priority || "MEDIUM"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { TaskPanel };
