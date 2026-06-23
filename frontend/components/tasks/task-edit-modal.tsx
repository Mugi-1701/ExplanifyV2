"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { Task, TaskStatus, UpdateTaskInput } from "@/types/task";

type TaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: NonNullable<UpdateTaskInput["priority"]>;
  assigneeId: string;
  requiredSkills: string[];
};

const SKILLS = ["Frontend", "Backend", "AI/ML", "UI/UX", "Testing", "DevOps"] as const;

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
      requiredSkills: task?.requiredSkills ?? [],
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
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId || undefined,
      requiredSkills: values.requiredSkills,
    };
    // TEMP DEBUG: selected skills before submit and final request payload.
    // eslint-disable-next-line no-console
    console.log("[tasks.update.ui] selected skills before submit", values.requiredSkills);
    // eslint-disable-next-line no-console
    console.log("[tasks.update.ui] request payload", payload);
    try {
      await onSubmit(payload);
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

        <div className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Assign To</span>
          <Select
            dropdownId="task-edit-assignee"
            value={values.assigneeId}
            onChange={(value) => setValues((current) => ({ ...current, assigneeId: value }))}
            placeholder="Unassigned"
            options={[
              { value: "", label: "Unassigned" },
              ...assignees.map((assignee) => ({
                value: assignee.id,
                label: `${assignee.name} (${assignee.email})`,
              })),
            ]}
          />
        </div>

        <div className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Status</span>
          <Select
            dropdownId="task-edit-status"
            value={values.status}
            onChange={(value) => setValues((current) => ({ ...current, status: value as TaskStatus }))}
            options={(["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "CANCELED"] as const).map((status) => ({
              value: status,
              label: status.replaceAll("_", " "),
            }))}
          />
        </div>

        <div className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Priority</span>
          <Select
            dropdownId="task-edit-priority"
            value={values.priority}
            onChange={(value) =>
              setValues((current) => ({
                ...current,
                priority: value as NonNullable<UpdateTaskInput["priority"]>,
              }))
            }
            options={(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((priority) => ({
              value: priority,
              label: priority,
            }))}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Required Skills</span>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => {
              const selected = values.requiredSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      requiredSkills: selected
                        ? current.requiredSkills.filter((item) => item !== skill)
                        : [...current.requiredSkills, skill],
                    }))
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                    selected ? "border-violet-400/30 bg-violet-500/15 text-violet-100" : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

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
