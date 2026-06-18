"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { AddProjectMemberInput, ProjectMember, ProjectMemberRole, ProjectSkill } from "@/types/project";
import type { WorkspaceUser } from "@/services/users.service";

const SKILLS: ProjectSkill[] = ["Frontend", "Backend", "AI/ML", "UI/UX", "Testing", "DevOps"];

type ProjectMemberModalProps = {
  open: boolean;
  users: WorkspaceUser[];
  mode: "add" | "edit";
  member?: ProjectMember | null;
  onClose: () => void;
  onSubmit: (input: AddProjectMemberInput) => Promise<void>;
};

function ProjectMemberModal({ open, users, mode, member, onClose, onSubmit }: ProjectMemberModalProps) {
  const initialValues = useMemo(
    () => ({
      userId: member?.userId ?? "",
      role: (member?.role ?? "MEMBER") as ProjectMemberRole,
      skills: (member?.skills ?? []) as ProjectSkill[],
    }),
    [member]
  );
  const [values, setValues] = useState(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setError(null);
  }, [initialValues, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.userId) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(values);
      onClose();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to add member."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title={mode === "add" ? "Add member" : "Edit member"}
      description={mode === "add" ? "Add a team member to this project." : "Update role and skills for this member."}
      size="md"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Name / Email</span>
          <select
            value={values.userId}
            disabled={mode === "edit"}
            onChange={(event) => setValues((current) => ({ ...current, userId: event.target.value }))}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            <option value="">Select a workspace user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Role</span>
          <select
            value={values.role}
            onChange={(event) => setValues((current) => ({ ...current, role: event.target.value as ProjectMemberRole }))}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            {(["OWNER", "LEAD", "MEMBER"] as const).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">Skills</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SKILLS.map((skill) => {
              const checked = values.skills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      skills: checked ? current.skills.filter((item) => item !== skill) : [...current.skills, skill],
                    }))
                  }
                  className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
                    checked ? "border-violet-400/30 bg-violet-500/15 text-violet-100" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !values.userId} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50">
            {submitting ? (mode === "add" ? "Adding..." : "Saving...") : mode === "add" ? "Add member" : "Save member"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export { ProjectMemberModal };
