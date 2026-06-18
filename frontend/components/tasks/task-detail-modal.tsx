"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useToast } from "@/components/ui/toast";
import { TaskBadges } from "./task-badges";
import { getTaskDependencyNodes } from "./task-utils";
import type { Task, TaskStatus, UpdateTaskInput } from "@/types/task";

type TaskDetailModalProps = {
  open: boolean;
  task: Task | null;
  assignees: { id: string; name: string; email: string }[];
  onClose: () => void;
  onSubmit: (input: UpdateTaskInput) => Promise<void>;
  onDelete: (task: Task) => void;
};

type TaskDetailValues = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: NonNullable<UpdateTaskInput["priority"]>;
  dueDate: string;
  estimateHours: string;
  assigneeId: string;
};

function getSuggestedPriority(dueDate?: string | null) {
  if (!dueDate) return "MEDIUM";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dueDate);
  deadline.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((deadline.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "CRITICAL";
  if (diffDays <= 1) return "CRITICAL";
  if (diffDays <= 3) return "HIGH";
  if (diffDays <= 7) return "MEDIUM";
  return "LOW";
}

function getPriorityReason(dueDate?: string | null) {
  if (!dueDate) return "No deadline set.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dueDate);
  deadline.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((deadline.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "Deadline has passed.";
  if (diffDays <= 1) return "Deadline is within 1 day.";
  if (diffDays <= 3) return "Deadline is within 3 days.";
  if (diffDays <= 7) return "Deadline is within 7 days.";
  return "Deadline is 8 or more days away.";
}

function getCoordinationExplanation(task?: Task | null) {
  if (!task) return "No coordination information available.";
  if (task.coordinationReason) return task.coordinationReason;
  if (task.isBlocked) return "Task is blocked by dependencies.";
  if (task.status === "IN_PROGRESS") return "Task is already in progress.";
  return "Task can be started immediately.";
}

function getDependencySummary(nodes: ReturnType<typeof getTaskDependencyNodes>) {
  return nodes.length > 0 ? "Dependencies detected." : "No dependencies detected.\nTask can proceed independently.";
}

function TaskDetailModal({ open, task, assignees, onClose, onSubmit, onDelete }: TaskDetailModalProps) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [values, setValues] = useState<TaskDetailValues>({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
    estimateHours: "",
    assigneeId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dependencyNodes = useMemo(() => (task ? getTaskDependencyNodes(task) : []), [task]);
  const suggestedPriority = getSuggestedPriority(task?.dueDate);
  const manualOverride = Boolean(task?.priority && task?.priority !== suggestedPriority);
  const coordinationExplanation = getCoordinationExplanation(task);
  const dependencySummary = getDependencySummary(dependencyNodes);

  useEffect(() => {
    if (!open || !task) return;
    setMode("view");
    setValues({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: (task.priority as NonNullable<UpdateTaskInput["priority"]>) ?? "MEDIUM",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      estimateHours: task.estimateHours ? String(task.estimateHours) : "",
      assigneeId: task.assigneeId ?? "",
    });
    setError(null);
    setSubmitting(false);
  }, [open, task]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate || undefined,
        estimateHours: values.estimateHours ? Number(values.estimateHours) : undefined,
        assigneeId: values.assigneeId || undefined,
      });
      toast({ title: "Task updated", description: values.title.trim() || task?.title, variant: "success" });
      setMode("view");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to save task changes."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} title="Task details" description="Review the full task context, priority intelligence, and dependency state." size="xl">
      {mode === "edit" ? (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Input value={values.title} onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30" placeholder="Task title" />
              <TaskBadges task={task} />
            </div>
            <textarea
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
              placeholder="Task description"
              className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm text-white/65">
              <span className="text-xs uppercase tracking-[0.18em] text-white/40">Status</span>
              <select value={values.status} onChange={(event) => setValues((current) => ({ ...current, status: event.target.value as TaskStatus }))} className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15">
                {(["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "CANCELED"] as const).map((status) => (
                  <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-white/65">
              <span className="text-xs uppercase tracking-[0.18em] text-white/40">Priority</span>
              <select value={values.priority} onChange={(event) => setValues((current) => ({ ...current, priority: event.target.value as NonNullable<UpdateTaskInput["priority"]> }))} className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15">
                {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm text-white/65">
              <span className="text-xs uppercase tracking-[0.18em] text-white/40">Assign To</span>
              <select value={values.assigneeId} onChange={(event) => setValues((current) => ({ ...current, assigneeId: event.target.value }))} className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15">
                <option value="">Unassigned</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>{assignee.name} ({assignee.email})</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-white/65">
              <span className="text-xs uppercase tracking-[0.18em] text-white/40">Deadline</span>
              <Input type="date" value={values.dueDate} onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-white/5 text-white" />
            </label>
            <label className="space-y-2 text-sm text-white/65 md:col-span-2">
              <span className="text-xs uppercase tracking-[0.18em] text-white/40">Estimated Duration</span>
              <Input type="number" min={1} step={1} value={values.estimateHours} onChange={(event) => setValues((current) => ({ ...current, estimateHours: event.target.value }))} className="h-12 rounded-2xl border-white/10 bg-white/5 text-white" />
            </label>
          </div>

          {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Button type="button" variant="outline" onClick={() => setMode("view")} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">Cancel</Button>
            <Button type="submit" disabled={submitting || !values.title.trim()} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50">{submitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-white">{task.title}</h2>
              <TaskBadges task={task} />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-white/70">{task.description || "No description provided."}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Status</p><p className="mt-1 text-sm text-white/80">{task.status.replaceAll("_", " ")}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Priority</p><p className="mt-1 text-sm text-white/80">{task.priority ?? "MEDIUM"}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Deadline</p><p className="mt-1 text-sm text-white/80">{task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Not set"}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Estimated Duration</p><p className="mt-1 text-sm text-white/80">{task.estimateHours ? `${task.estimateHours}h` : "Not set"}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3 md:col-span-2"><p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Assigned To</p><p className="mt-1 text-sm text-white/80">{task.assignee?.name ?? "Unassigned"}</p></div>
          </div>
          <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-4"><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-200">Priority Intelligence</p><p className="mt-2 text-sm leading-6 text-white/75">Priority: <span className="font-semibold text-white">{task.priority ?? "MEDIUM"}</span><br />{manualOverride ? "Manually overridden by user." : `AI Suggested because: ${getPriorityReason(task.dueDate)}`}</p></div>
          <div className="rounded-2xl border border-blue-400/15 bg-blue-500/10 p-4"><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-200">Coordination</p><p className="mt-2 text-sm leading-6 text-white/75">{coordinationExplanation}</p></div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Dependency State</p></div>
            {dependencyNodes.length > 0 ? (
              <div className="space-y-2">{dependencyNodes.map((dependency) => <div key={dependency.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"><span className="truncate text-white">{dependency.title}</span><span className="text-white/50">{dependency.status}</span></div>)}</div>
            ) : (
              <p className="whitespace-pre-line text-sm text-white/50">{dependencySummary}</p>
            )}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Button type="button" variant="outline" onClick={() => setMode("edit")} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">Edit</Button>
            <Button type="button" variant="outline" onClick={() => { onDelete(task); onClose(); }} className="rounded-2xl border-red-400/15 bg-red-500/10 text-red-100 hover:bg-red-500/20">Delete</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export { TaskDetailModal };
