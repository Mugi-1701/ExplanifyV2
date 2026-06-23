"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Edit3, Trash2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { CreateTaskInput, Task } from "@/types/task";
import { TaskBadges } from "./task-badges";
import { getTaskDependencyNodes } from "./task-utils";

type TaskCardProps = {
  task: Task;
  onUpdateStatus: (task: Task, status: Task["status"]) => void;
  onUpdatePriority: (task: Task, priority: NonNullable<CreateTaskInput["priority"]>) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSelectTask: (task: Task) => void;
};

function TaskCard({ task, onUpdateStatus, onUpdatePriority, onDelete, onEdit, onSelectTask }: TaskCardProps) {
  const dependencyNodes = getTaskDependencyNodes(task);
  const dependencyCount = dependencyNodes.length;
  const formattedUpdatedAt = task.updatedAt
    ? new Date(task.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
      <Card className="group h-full overflow-hidden border-white/10 bg-white/[0.04] transition hover:border-white/15 hover:bg-white/[0.055]">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <CardTitle className="text-lg text-white transition group-hover:text-violet-100">{task.title}</CardTitle>
              <CardDescription className="line-clamp-3 min-h-12 text-white/60">
                {task.description || "No description provided yet."}
              </CardDescription>
            </div>
            {task.isBlocked ? (
              <div className="flex size-10 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-500/10 text-amber-200">
                <AlertCircle className="size-5" />
              </div>
            ) : (
              <div className="flex size-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                <CheckCircle2 className="size-5" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={task.isBlocked ? "warning" : task.status === "DONE" ? "success" : "blue"}>{task.status.replaceAll("_", " ")}</Badge>
            <Badge variant={task.priority === "CRITICAL" ? "destructive" : task.priority === "HIGH" ? "warning" : "muted"}>
              {task.priority ?? "MEDIUM"}
            </Badge>
            <Badge variant="muted">Assigned {task.assignee?.name ?? "Unassigned"}</Badge>
            {formattedUpdatedAt ? <Badge variant="muted">Updated {formattedUpdatedAt}</Badge> : null}
            {task.calendarEvent ? (
              <Badge variant="blue">
                Scheduled {new Date(task.calendarEvent.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Badge>
            ) : null}
          </div>

          <TaskBadges task={task} />
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between text-sm text-white/65">
              <span>Dependency indicators</span>
              <span>{dependencyCount} linked</span>
            </div>
            <div className="mt-3 space-y-2">
              {dependencyNodes.length > 0 ? (
                dependencyNodes.map((dependency) => (
                  <div key={dependency.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-white">{dependency.title}</span>
                    <span className="shrink-0 text-white/45">{dependency.status}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/45">No dependency chain attached.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-100">
              <Zap className="size-4" />
              AI explanation preview
            </div>
            <p className="mt-2 text-sm leading-6 text-white/75">
              {task.coordinationReason || "No coordination explanation available yet."}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/45">
              Status
              <Select
                dropdownId={`task-card-status-${task.id}`}
                value={task.status}
                onChange={(value) => onUpdateStatus(task, value as Task["status"])}
                options={(["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "CANCELED"] as const).map((status) => ({
                  value: status,
                  label: status.replaceAll("_", " "),
                }))}
                className="mt-2 w-full"
              />
            </label>

            <label className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/45">
              Priority
              <Select
                dropdownId={`task-card-priority-${task.id}`}
                value={task.priority ?? "MEDIUM"}
                onChange={(value) => onUpdatePriority(task, value as NonNullable<CreateTaskInput["priority"]>)}
                options={(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((priority) => ({
                  value: priority,
                  label: priority,
                }))}
                className="mt-2 w-full"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onSelectTask(task)}>
              Inspect
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onUpdateStatus(task, task.status === "DONE" ? "IN_PROGRESS" : "DONE")}>
              <CheckCircle2 className="mr-2 size-4" />
              {task.status === "DONE" ? "Reopen" : "Mark done"}
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onUpdateStatus(task, "IN_PROGRESS")}>
              Active
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onEdit(task)}>
              <Edit3 className="mr-2 size-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="rounded-full border-red-400/15 bg-red-500/10 text-red-100 hover:bg-red-500/20" onClick={() => onDelete(task)}>
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { TaskCard };
