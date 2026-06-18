"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { CreateProjectInput, Project, UpdateProjectInput } from "@/types/project";

type ProjectFormValues = {
  name: string;
  description: string;
  slug: string;
  orgId: string;
  teamId: string;
  startDate: string;
  dueDate: string;
};

type ProjectFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  defaultOrgId?: string;
  project?: Project | null;
  onClose: () => void;
  onSubmit: (input: CreateProjectInput | UpdateProjectInput) => Promise<void>;
};

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function ProjectFormModal({ open, mode, defaultOrgId, project, onClose, onSubmit }: ProjectFormModalProps) {
  const initialValues = useMemo<ProjectFormValues>(
    () => ({
      name: project?.name ?? "",
      description: project?.description ?? "",
      slug: project?.slug ?? "",
      orgId: project?.orgId ?? defaultOrgId ?? "",
      teamId: project?.teamId ?? "",
      startDate: toDateInputValue(project?.startDate),
      dueDate: toDateInputValue(project?.dueDate),
    }),
    [defaultOrgId, project]
  );

  const [values, setValues] = useState<ProjectFormValues>(initialValues);
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
      if (mode === "create") {
        await onSubmit({
          orgId: values.orgId.trim(),
          name: values.name.trim(),
          slug: values.slug.trim() || undefined,
          description: values.description.trim() || undefined,
          teamId: values.teamId.trim() || undefined,
          startDate: values.startDate || undefined,
          dueDate: values.dueDate || undefined,
        });
      } else {
        await onSubmit({
          name: values.name.trim(),
          slug: values.slug.trim() || undefined,
          description: values.description.trim() || undefined,
          teamId: values.teamId.trim() || undefined,
          startDate: values.startDate || undefined,
          dueDate: values.dueDate || undefined,
        });
      }

      onClose();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, mode === "create" ? "Unable to create project." : "Unable to update project."));
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
                  <CardTitle className="text-2xl text-white">{mode === "create" ? "Create project" : "Edit project"}</CardTitle>
                  <CardDescription className="mt-1 text-white/60">
                    {mode === "create"
                      ? "Spin up a new project workspace in the active organization."
                      : "Update the project definition without breaking the active dashboard flow."}
                  </CardDescription>
                </div>
                <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10">
                  <X className="size-4" />
                </button>
              </CardHeader>

              <CardContent>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                  {mode === "create" ? (
                    <Input
                      value={values.orgId}
                      onChange={(event) => setValues((current) => ({ ...current, orgId: event.target.value }))}
                      placeholder="Organization ID"
                      className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30 md:col-span-2"
                    />
                  ) : null}

                  <Input
                    value={values.name}
                    onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Project name"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30 md:col-span-2"
                  />

                  <Input
                    value={values.slug}
                    onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))}
                    placeholder="Slug (optional)"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  />

                  <Input
                    value={values.teamId}
                    onChange={(event) => setValues((current) => ({ ...current, teamId: event.target.value }))}
                    placeholder="Team ID (optional)"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
                  />

                  <textarea
                    value={values.description}
                    onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Project description"
                    className="min-h-32 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 md:col-span-2"
                  />

                  <Input
                    value={values.startDate}
                    onChange={(event) => setValues((current) => ({ ...current, startDate: event.target.value }))}
                    type="date"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white md:col-span-1"
                  />

                  <Input
                    value={values.dueDate}
                    onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
                    type="date"
                    className="h-12 rounded-2xl border-white/10 bg-white/5 text-white md:col-span-1"
                  />

                  {error ? (
                    <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">
                      {error}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
                    <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting || !values.name.trim() || (mode === "create" && !values.orgId.trim())} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50">
                      {submitting ? "Saving..." : mode === "create" ? "Create project" : "Save changes"}
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

export { ProjectFormModal };
