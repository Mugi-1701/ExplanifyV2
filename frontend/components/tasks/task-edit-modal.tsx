"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { Task, TaskStatus, UpdateTaskInput } from "@/types/task";

type TaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: NonNullable<UpdateTaskInput["priority"]>;
  assigneeId: string;
};

type TaskEditModalProps = {
  open: boolean;
  task: Task | null;
  assignees: { id: string; name: string; email: string }[];
  onClose: () => void;
  onSubmit: (input: UpdateTaskInput) => Promise<void>;
};

function TaskEditModal({ open, task, assignees, onClose, onSubmit }: TaskEditModalProps) {
  const initialValues = useMemo<TaskFormValues>(
    () => ({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: (task?.priority as NonNullable<UpdateTaskInput["priority"]>) ?? "MEDIUM",
      assigneeId: task?.assigneeId ?? "",
    }),
    [task]
  );

  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (open && !cancelled) {
        setValues(initialValues);
        setError(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialValues, open]);

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
        assigneeId: values.assigneeId || undefined,
      });
      onClose();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to save task changes."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="Edit task"
      description="Update the live task details without breaking the coordination flow."
      size="lg"
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Input
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          placeholder="Task title"
          className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30 md:col-span-2"
        />

        <textarea
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="Task description"
          className="min-h-32 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 md:col-span-2"
        />

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Assign To</span>
          <select
            value={values.assigneeId}
            onChange={(event) => setValues((current) => ({ ...current, assigneeId: event.target.value }))}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            <option value="">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name} ({assignee.email})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Status</span>
          <select
            value={values.status}
            onChange={(event) => setValues((current) => ({ ...current, status: event.target.value as TaskStatus }))}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            {(["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "CANCELED"] as const).map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Priority</span>
          <select
            value={values.priority}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                priority: event.target.value as NonNullable<UpdateTaskInput["priority"]>,
              }))
            }
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>

        {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">{error}</div> : null}

        <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !values.title.trim()} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50">
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export { TaskEditModal };
