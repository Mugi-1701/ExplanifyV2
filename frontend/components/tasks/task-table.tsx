"use client";

import { CheckCircle2, Edit3, Eye, GripVertical, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CreateTaskInput, Task } from "@/types/task";
import { TaskBadges } from "./task-badges";
import { getTaskHealthLabel } from "./task-utils";

type TaskTableProps = {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (task: Task, status: Task["status"]) => void;
  onUpdatePriority: (task: Task, priority: NonNullable<CreateTaskInput["priority"]>) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
};

function TaskTable({ tasks, onSelectTask, onUpdateStatus, onUpdatePriority, onDelete, onEdit }: TaskTableProps) {
  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.03]">
      <div className="hidden border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.18em] text-white/45 md:grid md:grid-cols-[1.6fr_0.95fr_0.95fr_0.8fr_0.7fr]">
        <span>Task</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Coordination</span>
        <span>Actions</span>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-white/10">
          {tasks.map((task) => (
            <div key={task.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1.6fr_0.95fr_0.95fr_0.8fr_0.7fr] md:items-center">
              <button type="button" className="group text-left" onClick={() => onSelectTask(task)}>
                <div className="flex items-center gap-3">
                  <GripVertical className="hidden size-4 text-white/25 md:block" />
                  <div>
                    <p className="font-medium text-white group-hover:text-violet-100">{task.title}</p>
                    <p className="mt-1 text-sm text-white/50">{task.description || "No description provided."}</p>
                  </div>
                </div>
              </button>

              <div className="md:hidden">
                <TaskBadges task={task} />
              </div>

              <div className="hidden md:block">
                <select
                  value={task.status}
                  onChange={(event) => onUpdateStatus(task, event.target.value as Task["status"])}
                  className="h-11 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
                >
                  {(["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "CANCELED"] as const).map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden md:block">
                <select
                  value={task.priority ?? "MEDIUM"}
                  onChange={(event) =>
                    onUpdatePriority(task, event.target.value as NonNullable<CreateTaskInput["priority"]>)
                  }
                  className="h-11 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
                >
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden md:flex md:justify-end">
                <Badge variant={task.isBlocked ? "warning" : "success"}>{getTaskHealthLabel(task)}</Badge>
              </div>

              <div className="hidden flex-wrap gap-2 md:flex md:justify-end">
                <button type="button" onClick={() => onSelectTask(task)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
                  <Eye className="size-4" />
                  View
                </button>
                <button type="button" onClick={() => onEdit(task)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 hover:bg-white/10">
                  <Edit3 className="size-4" />
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(task)} className="inline-flex items-center gap-2 rounded-full border border-red-400/15 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:bg-red-500/20">
                  <Trash2 className="size-4" />
                  Delete
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
