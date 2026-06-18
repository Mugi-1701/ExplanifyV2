import { CalendarDays, ListTodo, Plus, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectMember, ProjectWithStats } from "@/types/project";
import { formatProjectDate, getCoordinationTone } from "./project-utils";

type ProjectInsightsCardProps = {
  project: ProjectWithStats | null;
  activeTab: "overview" | "tasks" | "team";
  onTabChange: (tab: "overview" | "tasks" | "team") => void;
  onAddMember: () => void;
  onEditMember: (member: ProjectMember) => void;
  onRemoveMember: (member: ProjectMember) => void;
};

function ProjectInsightsCard({ project, activeTab, onTabChange, onAddMember, onEditMember, onRemoveMember }: ProjectInsightsCardProps) {
  if (!project) {
    return (
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-xl text-white">Project details</CardTitle>
          <CardDescription className="text-white/60">Select a project to see overview, tasks, and team.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const members = project.members ?? [];
  const tasks = project.tasks ?? [];

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-white">{project.name}</CardTitle>
            <CardDescription className="mt-2 text-white/60">{project.description || "No description provided."}</CardDescription>
          </div>
          <div className={`rounded-2xl border px-3 py-2 text-xs font-medium ${getCoordinationTone(project.stats.coordinationHealth)}`}>
            {project.stats.coordinationHealth}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
          {[
            { key: "overview", label: "Overview" },
            { key: "tasks", label: "Tasks" },
            { key: "team", label: "Team" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key as "overview" | "tasks" | "team")}
              className={`rounded-xl px-4 py-2 text-sm transition ${
                activeTab === tab.key ? "bg-violet-500/20 text-violet-100" : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeTab === "overview" ? (
          <>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              <div className="flex items-center gap-2 text-blue-200">
                <Sparkles className="size-4" />
                Project overview
              </div>
              <p>{project.stats.coordinationReason}</p>
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-white/45" />
                Created {formatProjectDate(project.createdAt)}
              </div>
              <div>Organization: {project.organization?.name ?? project.orgId ?? "Unknown org"}</div>
              <div>Tasks: {project.stats.taskCount}</div>
              <div>Blocked tasks: {project.stats.blockedTaskCount}</div>
              <div>Team members: {members.length}</div>
            </div>
          </>
        ) : null}

        {activeTab === "tasks" ? (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-blue-200">
              <ListTodo className="size-4" />
              Task summary
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Assigned" value={tasks.filter((task) => Boolean(task.assigneeId)).length} />
              <Metric label="Active" value={tasks.filter((task) => task.status === "IN_PROGRESS").length} />
              <Metric label="Completed" value={tasks.filter((task) => task.status === "DONE").length} />
            </div>
            <p className="text-white/50">Task assignment is managed from the Create Task and Task Details flows.</p>
          </div>
        ) : null}

        {activeTab === "team" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-white">
                <Users className="size-4 text-violet-200" />
                Team Members
              </div>
              <Button variant="outline" size="sm" onClick={onAddMember} className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
                <Plus className="mr-2 size-4" />
                Add Member
              </Button>
            </div>

            <div className="space-y-3">
              {members.length > 0 ? members.map((member) => <MemberCard key={member.id} member={member} tasks={tasks} onEdit={onEditMember} onRemove={onRemoveMember} />) : <p className="text-sm text-white/50">No members have been added yet.</p>}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MemberCard({
  member,
  tasks,
  onEdit,
  onRemove,
}: {
  member: ProjectMember;
  tasks: { assigneeId?: string | null; status: string }[];
  onEdit: (member: ProjectMember) => void;
  onRemove: (member: ProjectMember) => void;
}) {
  const assignedTaskCount = tasks.filter((task) => task.assigneeId === member.userId).length;
  const activeTaskCount = tasks.filter((task) => task.assigneeId === member.userId && task.status === "IN_PROGRESS").length;
  const completedTaskCount = tasks.filter((task) => task.assigneeId === member.userId && task.status === "DONE").length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-white">{member.user?.name ?? "Unknown member"}</p>
          <p className="text-xs text-white/45">{member.user?.email ?? ""}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">{member.role}</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(member.skills ?? []).map((skill) => (
          <span key={skill} className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-violet-100">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-white/65">
        <Metric label="Assigned" value={assignedTaskCount} />
        <Metric label="Active" value={activeTaskCount} />
        <Metric label="Completed" value={completedTaskCount} />
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(member)} className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10">
          Edit
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onRemove(member)} className="rounded-full border-red-400/15 bg-red-500/10 text-red-100 hover:bg-red-500/20">
          Remove
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

export { ProjectInsightsCard };
