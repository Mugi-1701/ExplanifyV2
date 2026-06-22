"use client";

import { useEffect, useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/api-errors";
// team service types not required here
import { getOrganizationMembers } from "@/services/users.service";
import type { CreateProjectInput, Project, UpdateProjectInput } from "@/types/project";

type ProjectFormValues = {
  name: string;
  description: string;
  orgId: string;
  teamId: string;
  startDate: string;
  dueDate: string;
  priority: string;
  status: string;
};

type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
};

type OrgMember = {
  id: string;
  userId: string;
  role: string;
  user: WorkspaceUser;
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
  return value ? value.slice(0, 10) : "";
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="col-span-full mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-white/40">
      {title}
    </div>
  );
}

function ProjectFormModal({ open, mode, defaultOrgId, project, onClose, onSubmit }: ProjectFormModalProps) {
  function computeInitialValues(): ProjectFormValues {
    return {
      name: project?.name ?? "",
      description: project?.description ?? "",
      orgId: project?.orgId ?? defaultOrgId ?? "",
      teamId: project?.teamId ?? "",
      startDate: toDateInputValue(project?.startDate),
      dueDate: toDateInputValue(project?.dueDate),
      priority: "",
      status: "PLANNING",
    };
  }



  const [values, setValues] = useState<ProjectFormValues>(() => computeInitialValues());
  const [leadId, setLeadId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [coordinationId, setCoordinationId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (open && !cancelled) {
        setValues(computeInitialValues());
        setLeadId("");
        setError(null);
      }
    });

    if (open) {
      // prefetch org members to populate Project Lead dropdown
      getOrganizationMembers(defaultOrgId)
        .then((data: any) => {
          if (!cancelled) setMembers(Array.isArray(data) ? data : data.data || []);
        })
        .catch(() => {});

      // generate a coordination id for this modal session
      const id = String(Math.floor(1000 + Math.random() * 9000));
      setCoordinationId(id);
    }

    return () => {
      cancelled = true;
    };
  }, [open, project, defaultOrgId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    try {
        if (mode === "create") {
        await onSubmit({
          orgId: values.orgId.trim(),
          name: values.name.trim(),
          description: values.description.trim() || undefined,
          teamId: values.teamId.trim() || undefined,
          startDate: values.startDate || undefined,
          dueDate: values.dueDate || undefined,
          priority: values.priority || undefined,
          status: values.status || undefined,
          leadId: leadId || undefined,
        });
      } else {
        await onSubmit({
          name: values.name.trim(),
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title={mode === "create" ? "Create project" : "Edit project"}
      description="Define the core coordination settings for your workspace."
      size="lg"
      className="max-w-[850px] w-full"
    >
      <form className="grid gap-4 grid-cols-1 md:grid-cols-2" onSubmit={handleSubmit}>
        <SectionHeader title="Project Name" />

        <Input
          autoFocus
          required
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          placeholder="Project name"
          className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30 md:col-span-2"
        />

        <SectionHeader title="Description" />

        <textarea
          required
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="What is this workspace for?"
          className="min-h-24 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 md:col-span-2"
        />

        <SectionHeader title="Priority & Lead" />

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Priority</span>
          <Select
            dropdownId="priority-selector"
            value={values.priority}
            onChange={(v) => setValues((current) => ({ ...current, priority: v }))}
            options={[
              { value: "", label: "Select priority" },
              { value: "LOW", label: "Low" },
              { value: "MEDIUM", label: "Medium" },
              { value: "HIGH", label: "High" },
              { value: "CRITICAL", label: "Critical" },
            ]}
          />
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Project Lead (optional)</span>
          <Select
            dropdownId="project-lead-selector"
            value={leadId}
            onChange={(v) => setLeadId(v)}
            options={[{ value: "", label: "Unassigned" }, ...members.map((m) => ({ value: m.user.id, label: m.user.name }))]}
          />
        </label>

        <div className="md:col-span-2">
          <SectionHeader title="Coordination ID" />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 inline-flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.12em] text-white/45">Coordination ID</span>
              <span className="font-mono text-2xl text-emerald-300">#{coordinationId}</span>
            </div>
          </div>
        </div>

        <SectionHeader title="Timeline" />

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Start Date</span>
          <input
            type="date"
            value={values.startDate}
            onChange={(event) => setValues((current) => ({ ...current, startDate: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          />
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Target Date</span>
          <input
            type="date"
            value={values.dueDate}
            onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          />
        </label>

        {error ? (
          <div className="mt-2 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              submitting ||
              !values.name.trim() ||
              !values.description.trim() ||
              !values.priority ||
              !values.startDate ||
              !values.dueDate
            }
            className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? "Saving..." : mode === "create" ? "Create project" : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export { ProjectFormModal };
