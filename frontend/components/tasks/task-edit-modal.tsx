"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Task, TaskStatus, UpdateTaskInput } from "@/types/task";

type TaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: NonNullable<UpdateTaskInput["priority"]>;
};

type TaskEditModalProps = {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (input: UpdateTaskInput) => Promise<void>;
};

function TaskEditModal({ open, task, onClose, onSubmit }: TaskEditModalProps) {
  const initialValues = useMemo<TaskFormValues>(
    () => ({
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? "TODO",
      priority: (task?.priority as NonNullable<UpdateTaskInput["priority"]>) ?? "MEDIUM",
    }),
    [task]
  );

  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (open && !cancelled) {
        setValues(initialValues);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialValues, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        status: values.status,
        priority: values.priority,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 18, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="w-full max-w-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Card className="border-white/10 bg-[#0a1022]/95 shadow-[0_35px_100px_-30px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-white">Edit task</CardTitle>
                  <CardDescription className="mt-1 text-white/60">
                    Update the live task details without breaking the coordination flow.
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10"
                >
                  <X className="size-4" />
                </button>
              </CardHeader>

              <CardContent>
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
                    <span className="text-xs uppercase tracking-[0.18em] text-white/45">Status</span>
                    <select
                      value={values.status}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, status: event.target.value as TaskStatus }))
                      }
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

                  <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !values.title.trim()}
                      className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50"
                    >
                      {submitting ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export { TaskEditModal };
