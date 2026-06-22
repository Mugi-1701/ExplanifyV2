"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { Check, ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useToast } from "@/components/ui/toast";
import type { AddProjectMemberInput, ProjectMember } from "@/types/project";
import type { WorkspaceUser } from "@/services/users.service";
import { createRole, deleteRole, getRoles, updateRole, type WorkspaceRole } from "@/services/roles.service";
import { createSkill, deleteSkill, getSkills, updateSkill, type WorkspaceSkill } from "@/services/skills.service";

type ProjectMemberModalProps = {
  open: boolean;
  users: WorkspaceUser[];
  mode: "add" | "edit";
  member?: ProjectMember | null;
  onClose: () => void;
  onSubmit: (input: AddProjectMemberInput) => Promise<void>;
};

type FormState = {
  userId: string;
  roleId: string;
  skillIds: string[];
};

function ProjectMemberModal({ open, users, mode, member, onClose, onSubmit }: ProjectMemberModalProps) {
  const { toast } = useToast();
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [skills, setSkills] = useState<WorkspaceSkill[]>([]);
  const [values, setValues] = useState<FormState>({ userId: "", roleId: "", skillIds: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [skillQuery, setSkillQuery] = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [skillModalOpen, setSkillModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "role" | "skill"; id: string; label: string } | null>(null);
  const [catalogName, setCatalogName] = useState("");
  const userRootRef = useRef<HTMLDivElement | null>(null);
  const roleRootRef = useRef<HTMLDivElement | null>(null);
  const skillRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues({
      userId: member?.userId ?? "",
      roleId: member?.roleId ?? "",
      skillIds: member?.skillIds ?? [],
    });
    setError(null);
    setUserQuery("");
    setRoleQuery("");
    setSkillQuery("");
    setUserOpen(false);
    setRoleOpen(false);
    setSkillOpen(false);
    setEditingRole(null);
    setEditingSkill(null);
    setRoleModalOpen(false);
    setSkillModalOpen(false);
    setDeleteTarget(null);
    setCatalogName("");
  }, [member, open]);

  useEffect(() => {
    if (!open) return;
    void Promise.all([getRoles(), getSkills()])
      .then(([nextRoles, nextSkills]) => {
        setRoles(nextRoles);
        setSkills(nextSkills);
        setValues((current) => ({
          ...current,
          roleId: current.roleId || nextRoles.find((role) => role.name === member?.role)?.id || "",
          skillIds:
            current.skillIds.length > 0
              ? current.skillIds
              : nextSkills.filter((skill) => (member?.skills ?? []).includes(skill.name)).map((skill) => skill.id),
        }));
      })
      .catch(() => {
        setRoles([]);
        setSkills([]);
      });
  }, [member?.role, member?.skills, open]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (userRootRef.current && !userRootRef.current.contains(target)) setUserOpen(false);
      if (roleRootRef.current && !roleRootRef.current.contains(target)) setRoleOpen(false);
      if (skillRootRef.current && !skillRootRef.current.contains(target)) setSkillOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const userOptions = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    const items = users.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }));
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;
  }, [userQuery, users]);

  const roleOptions = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    const items = roles.map((role) => ({ value: role.id, label: role.name }));
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;
  }, [roleQuery, roles]);

  const skillOptions = useMemo(() => {
    const q = skillQuery.trim().toLowerCase();
    const items = skills.map((skill) => ({ value: skill.id, label: skill.name }));
    return q ? items.filter((item) => item.label.toLowerCase().includes(q)) : items;
  }, [skillQuery, skills]);

  const selectedSkillLabels = values.skillIds
    .map((id) => skills.find((skill) => skill.id === id)?.name)
    .filter(Boolean) as string[];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.userId) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        userId: values.userId,
        roleId: values.roleId || undefined,
        skillIds: values.skillIds,
      });
      onClose();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to add member."));
    } finally {
      setSubmitting(false);
    }
  }

  function normalizeName(name: string) {
    return name.trim();
  }

  async function createCatalogItem(type: "role" | "skill") {
    const clean = normalizeName(catalogName);
    if (!clean) {
      setError(`${type === "role" ? "Role" : "Skill"} name is required.`);
      return;
    }
    const existing = (type === "role" ? roles : skills).find((item) => item.name.trim().toLowerCase() === clean.toLowerCase());
    if (existing) {
      setError(`${type === "role" ? "Role" : "Skill"} name already exists.`);
      return;
    }
    try {
      if (type === "role") {
        if (editingRole) {
          const updated = await updateRole(editingRole, { name: clean });
          setRoles((current) => current.map((item) => (item.id === editingRole ? updated : item)));
          setValues((current) => ({ ...current, roleId: updated.id }));
          toast({ title: "Role updated", description: updated.name, variant: "success" });
        } else {
          const created = await createRole({ name: clean, permissions: {} });
          setRoles((current) => [...current, created]);
          setValues((current) => ({ ...current, roleId: created.id }));
          toast({ title: "Role created", description: created.name, variant: "success" });
        }
        setRoleModalOpen(false);
        setEditingRole(null);
      } else {
        if (editingSkill) {
          const updated = await updateSkill(editingSkill, { name: clean });
          setSkills((current) => current.map((item) => (item.id === editingSkill ? updated : item)));
          setValues((current) => ({
            ...current,
            skillIds: current.skillIds.map((skillId) => (skillId === editingSkill ? updated.id : skillId)),
          }));
          toast({ title: "Skill updated", description: updated.name, variant: "success" });
        } else {
          const created = await createSkill({ name: clean });
          setSkills((current) => [...current, created]);
          setValues((current) => ({ ...current, skillIds: current.skillIds.includes(created.id) ? current.skillIds : [...current.skillIds, created.id] }));
          toast({ title: "Skill created", description: created.name, variant: "success" });
        }
        setSkillModalOpen(false);
        setEditingSkill(null);
      }
      setCatalogName("");
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, `Unable to create ${type}.`));
    }
  }

  async function confirmDeleteCatalogItem() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "role") {
        await deleteRole(deleteTarget.id);
        setRoles((current) => current.filter((item) => item.id !== deleteTarget.id));
        if (values.roleId === deleteTarget.id) setValues((current) => ({ ...current, roleId: "" }));
      } else {
        await deleteSkill(deleteTarget.id);
        setSkills((current) => current.filter((item) => item.id !== deleteTarget.id));
        setValues((current) => ({ ...current, skillIds: current.skillIds.filter((skillId) => skillId !== deleteTarget.id) }));
      }
      toast({ title: `${deleteTarget.type === "role" ? "Role" : "Skill"} deleted`, description: deleteTarget.label, variant: "success" });
      setDeleteTarget(null);
    } catch (err) {
      setError(getApiErrorMessage(err, `Unable to delete ${deleteTarget.type}.`));
    }
  }

  async function toggleSkill(skill: WorkspaceSkill) {
    setValues((current) => ({
      ...current,
      skillIds: current.skillIds.includes(skill.id) ? current.skillIds.filter((id) => id !== skill.id) : [...current.skillIds, skill.id],
    }));
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
        <Combobox
          label="Workspace User"
          value={values.userId}
          query={userQuery}
          open={userOpen}
          onOpenChange={setUserOpen}
          onQueryChange={setUserQuery}
          onSelect={(nextValue) => {
            setValues((current) => ({ ...current, userId: nextValue }));
            setUserQuery("");
            setUserOpen(false);
          }}
          options={userOptions}
          placeholder="Select a workspace user"
          boxRef={userRootRef}
          disabled={mode === "edit"}
          creatable={false}
        />

        <Combobox
          label="Role"
          value={values.roleId}
          query={roleQuery}
          open={roleOpen}
          onOpenChange={setRoleOpen}
          onQueryChange={setRoleQuery}
          onSelect={(nextValue) => {
            setValues((current) => ({ ...current, roleId: nextValue }));
            setRoleQuery("");
            setRoleOpen(false);
          }}
          options={roleOptions}
          placeholder="Search or create role"
          boxRef={roleRootRef}
          creatable
          onEdit={(id) => {
            const role = roles.find((item) => item.id === id);
            if (!role) return;
            setEditingRole(id);
            setCatalogName(role.name);
            setRoleModalOpen(true);
          }}
          onDelete={(id) => {
            const role = roles.find((item) => item.id === id);
            if (!role) return;
            setDeleteTarget({ type: "role", id, label: role.name });
          }}
        />
        <div className="flex justify-end -mt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { setEditingRole(null); setCatalogName(""); setRoleModalOpen(true); }} className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
            <Plus className="mr-2 size-4" />
            Add Role
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Skills</p>
            <Button type="button" variant="outline" size="sm" onClick={() => { setEditingSkill(null); setCatalogName(""); setSkillModalOpen(true); }} className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Plus className="mr-2 size-4" />
              Add Skill
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedSkillLabels.map((skillName, index) => (
              <button
                key={`${skillName}-${index}`}
                type="button"
                onClick={() => {
                  const skill = skills.find((item) => item.name === skillName);
                  if (skill) void toggleSkill(skill);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-3 py-2 text-sm text-violet-100"
              >
                {skillName}
                <X className="size-3" />
              </button>
            ))}
          </div>

          <Combobox
            label="Skills"
            value=""
            query={skillQuery}
            open={skillOpen}
            onOpenChange={setSkillOpen}
            onQueryChange={setSkillQuery}
            onSelect={(nextValue) => {
              const skill = skills.find((item) => item.id === nextValue);
              if (skill) void toggleSkill(skill);
              setSkillQuery("");
              setSkillOpen(false);
            }}
            options={skillOptions}
            placeholder="Search or add skill..."
            boxRef={skillRootRef}
            creatable
            onEdit={(id) => {
              const skill = skills.find((item) => item.id === id);
              if (!skill) return;
              setEditingSkill(id);
              setCatalogName(skill.name);
              setSkillModalOpen(true);
            }}
            onDelete={(id) => {
              const skill = skills.find((item) => item.id === id);
              if (!skill) return;
              setDeleteTarget({ type: "skill", id, label: skill.name });
            }}
          />
        </div>

        <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen} title="Create Role" description="Add a new workspace role." size="sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-white/45">Role Name</label>
              <input value={catalogName} onChange={(event) => setCatalogName(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">Cancel</Button>
              <Button type="button" onClick={() => void createCatalogItem("role")} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white">Save</Button>
            </div>
          </div>
        </Dialog>
        <Dialog open={skillModalOpen} onOpenChange={setSkillModalOpen} title="Create Skill" description="Add a new workspace skill." size="sm">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.18em] text-white/45">Skill Name</label>
              <input value={catalogName} onChange={(event) => setCatalogName(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setSkillModalOpen(false)} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">Cancel</Button>
              <Button type="button" onClick={() => void createCatalogItem("skill")} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white">Save</Button>
            </div>
          </div>
        </Dialog>
        <Dialog open={Boolean(deleteTarget)} onOpenChange={(next) => !next && setDeleteTarget(null)} title={deleteTarget?.type === "role" ? "Delete Role?" : "Delete Skill?"} description={deleteTarget ? `Delete ${deleteTarget.label}? This action can't be undone.` : ""} size="sm">
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">Cancel</Button>
            <Button type="button" onClick={() => void confirmDeleteCatalogItem()} className="rounded-2xl bg-rose-500 text-white">Delete</Button>
          </div>
        </Dialog>

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

function Combobox({
  label,
  value,
  query,
  open,
  onOpenChange,
  onQueryChange,
  onSelect,
  options,
  placeholder,
  boxRef,
  disabled = false,
  creatable = false,
  onEdit,
  onDelete,
}: {
  label: string;
  value: string;
  query: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onQueryChange: (value: string) => void;
  onSelect: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  boxRef: React.RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  creatable?: boolean;
  onEdit?: (value: string) => void;
  onDelete?: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedLabel = options.find((item) => item.value === value)?.label ?? placeholder;

  useEffect(() => {
    if (open) {
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open]);

  return (
    <div ref={boxRef} className="relative space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && onOpenChange(!open)}
        className="flex h-14 w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 text-left text-sm text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`size-4 text-white/40 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full rounded-2xl border border-white/10 bg-[#0d1424] p-2 shadow-2xl">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
            <Search className="size-4 text-white/35" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const exact = options.find((item) => item.label.toLowerCase() === query.trim().toLowerCase());
                  if (exact) {
                    onSelect(exact.value);
                    return;
                  }
                }
                if (event.key === "Escape") onOpenChange(false);
              }}
              placeholder={`Search or create ${label.toLowerCase()}`}
              className="h-10 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
          <div className="mt-2 max-h-52 overflow-y-auto">
            {options.length > 0 ? (
              options.map((option) => (
                <div
                  key={option.value}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${
                    option.value === value ? "bg-violet-500/20 text-violet-100" : "text-white/75 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <button type="button" onClick={() => onSelect(option.value)} className="flex min-w-0 flex-1 items-center justify-between text-left">
                    <span className="truncate">{option.label}</span>
                    {option.value === value ? <Check className="size-4 text-violet-200" /> : null}
                  </button>
                  <div className="ml-2 flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onEdit?.(option.value)} className="text-white/55 hover:text-white">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDelete?.(option.value)} className="text-white/55 hover:text-rose-200">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-3 text-sm text-white/40">No matches found.</div>
            )}
            {creatable && query.trim() ? null : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export { ProjectMemberModal };
