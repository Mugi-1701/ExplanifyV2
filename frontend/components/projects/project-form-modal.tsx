"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useAuthStore } from "@/store/auth.store";
import { getTeams, type Team } from "@/services/team.service";
import { getOrganizationMembers } from "@/services/users.service";
import type { CreateProjectInput, Project, UpdateProjectInput } from "@/types/project";

type ProjectFormValues = {
  name: string;
  description: string;
  orgId: string;
  teamId: string;
  startDate: string;
  dueDate: string;
  category: string;
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
  const { session } = useAuthStore();

  const initialValues = useMemo<ProjectFormValues>(
    () => ({
      name: project?.name ?? "",
      description: project?.description ?? "",
      orgId: project?.orgId ?? defaultOrgId ?? "",
      teamId: project?.teamId ?? "",
      startDate: toDateInputValue(project?.startDate),
      dueDate: toDateInputValue(project?.dueDate),
      category: "Product Development",
      priority: "",
      status: "PLANNING",
    }),
    [defaultOrgId, project]
  );

  const [values, setValues] = useState<ProjectFormValues>(initialValues);
  const [leadId, setLeadId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTeamId, setGeneratedTeamId] = useState<string>("");

  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (open && !cancelled) {
        setValues(initialValues);
        setLeadId("");
        setError(null);
        setGeneratedTeamId(String(Math.floor(1000 + Math.random() * 9000)));
      }
    });

    if (open && defaultOrgId) {
      getTeams(defaultOrgId)
        .then((data) => {
          if (!cancelled) setTeams(data);
        })
        .catch(() => {});

      getOrganizationMembers(defaultOrgId)
        .then((data: any) => {
          if (!cancelled) setMembers(Array.isArray(data) ? data : data.data || []);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [initialValues, open, defaultOrgId]);

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
          category: values.category || undefined,
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
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <SectionHeader title="Project Basics" />
        
        <Input
          required
          value={values.name}
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          placeholder="Project name"
          className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30 md:col-span-2"
        />

        <textarea
          required
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="What is this workspace for?"
          className="min-h-24 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 md:col-span-2"
        />

        <SectionHeader title="Coordination" />

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Category</span>
          <select
            required
            value={values.category}
            onChange={(event) => setValues((current) => ({ ...current, category: event.target.value }))}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            <option value="Product Development">Product Development</option>
            <option value="AI Research">AI Research</option>
            <option value="Internal Tool">Internal Tool</option>
            <option value="Client Project">Client Project</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Priority</span>
          <select
            required
            value={values.priority}
            onChange={(event) => setValues((current) => ({ ...current, priority: event.target.value }))}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            <option value="" disabled>Select priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </label>

        <label className="space-y-2 text-sm text-white/65 md:col-span-2">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Status</span>
          <div className="flex h-12 w-full items-center rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white/50">
            {values.status.charAt(0) + values.status.slice(1).toLowerCase()}
          </div>
        </label>

        <SectionHeader title="Team" />

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Team Selection</span>
          <select
            required
            value={values.teamId}
            onChange={(event) => setValues((current) => ({ ...current, teamId: event.target.value }))}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            <option value="" disabled>Select a team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Project Lead</span>
          <select
            value={leadId}
            onChange={(event) => setLeadId(event.target.value)}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm">
          <span className="text-white/50">Generated Team ID</span>
          <span className="font-mono text-emerald-300">{generatedTeamId}</span>
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
            disabled={submitting || !values.name.trim() || !values.priority || !values.teamId}
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
