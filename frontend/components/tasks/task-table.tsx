"use client";

import { CheckCircle2, Eye, GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { CreateTaskInput, Task } from "@/types/task";
import { TaskBadges } from "./task-badges";
import { getTaskHealthLabel } from "./task-utils";

type TaskTableProps = {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (task: Task, status: Task["status"]) => void;
  onUpdatePriority: (task: Task, priority: NonNullable<CreateTaskInput["priority"]>) => void;
};

function TaskTable({ tasks, onSelectTask, onUpdateStatus, onUpdatePriority }: TaskTableProps) {
  return (
    <Card className="hidden-scrollbar overflow-hidden border-white/10 bg-white/[0.03]">
      <div className="hidden border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.18em] text-white/45 md:grid md:grid-cols-[1.45fr_0.85fr_0.85fr_0.95fr_0.8fr_0.55fr]">
        <span>Task</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Assigned To</span>
        <span>Coordination</span>
        <span>Actions</span>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-white/10">
          {tasks.map((task) => (
            <div key={task.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1.45fr_0.85fr_0.85fr_0.95fr_0.8fr_0.55fr] md:items-center">
              <button type="button" className="group text-left" onClick={() => onSelectTask(task)}>
                <div className="flex items-center gap-3">
                  <GripVertical className="hidden size-4 text-white/25 md:block" />
                  <div>
                    <p className="font-medium text-white group-hover:text-violet-100">{task.title}</p>
                    <p className="mt-1 text-sm text-white/50">{task.description || "No description provided."}</p>
                    <p className="mt-2 text-xs text-white/40">Assigned To: {task.assignee?.name ?? "Unassigned"}</p>
                    {task.calendarEvent ? (
                      <p className="mt-1 text-xs text-violet-200">
                        Scheduled: {new Date(task.calendarEvent.startTime).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>

              <div className="md:hidden">
                <TaskBadges task={task} />
              </div>

              <div className="hidden md:block">
                <Select
                  dropdownId={`task-table-status-${task.id}`}
                  value={task.status}
                  onChange={(value) => onUpdateStatus(task, value as Task["status"])}
                  options={(["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "CANCELED"] as const).map((status) => ({
                    value: status,
                    label: status.replaceAll("_", " "),
                  }))}
                  className="w-full"
                />
              </div>

              <div className="hidden md:block">
                <Select
                  dropdownId={`task-table-priority-${task.id}`}
                  value={task.priority ?? "MEDIUM"}
                  onChange={(value) => onUpdatePriority(task, value as NonNullable<CreateTaskInput["priority"]>)}
                  options={(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((priority) => ({
                    value: priority,
                    label: priority,
                  }))}
                  className="w-full"
                />
              </div>

              <div className="hidden md:flex md:justify-end">
                <span className="text-sm text-white/70">{task.assignee?.name ?? "Unassigned"}</span>
              </div>

              <div className="hidden md:flex md:justify-end">
                <Badge variant={task.isBlocked ? "warning" : "success"}>{getTaskHealthLabel(task)}</Badge>
              </div>

              <div className="hidden flex-wrap gap-2 md:flex md:justify-end">
                <button type="button" onClick={() => onSelectTask(task)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
                  <Eye className="size-4" />
                  View
                </button>
              </div>

              <div className="flex items-center justify-between md:hidden">
                <Badge variant={task.isBlocked ? "warning" : "success"}>{getTaskHealthLabel(task)}</Badge>
                <button type="button" onClick={() => onSelectTask(task)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70">
                  <CheckCircle2 className="size-4" />
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { TaskTable };
