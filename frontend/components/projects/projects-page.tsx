"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { ProjectCard } from "@/components/projects/project-card";
import { ProjectEmptyState } from "@/components/projects/project-empty-state";
import { ProjectErrorState } from "@/components/projects/project-error-state";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { ProjectInsightsCard } from "@/components/projects/project-insights-card";
import { ProjectMemberModal } from "@/components/projects/project-member-modal";
import { ProjectRow } from "@/components/projects/project-row";
import { ProjectSkeleton } from "@/components/projects/project-skeleton";
import { ProjectStats } from "@/components/projects/project-stats";
import { ProjectToolbar } from "@/components/projects/project-toolbar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { addProjectMember, removeProjectMember, updateProjectMember } from "@/services/project.service";
import { getUsers, type WorkspaceUser } from "@/services/users.service";
import { useProjects } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api-errors";
import { getActiveOrgIdFromAccessToken } from "@/lib/token";
import { queryKeys } from "@/lib/query-client";
import type { CreateProjectInput, ProjectMember, ProjectStats as ProjectStatsData, ProjectWithStats, UpdateProjectInput } from "@/types/project";
import { eventQueryKey } from "@/components/events/hooks/use-activity-timeline";

function ProjectsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { projects, activeProjectId, selectedProject, loading, error, refresh, selectProject, createNewProject, updateExistingProject, removeProject } = useProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [healthFilter, setHealthFilter] = useState<"ALL" | ProjectStatsData["coordinationHealth"]>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);
  const [isMemberOpen, setIsMemberOpen] = useState(false);
  const [memberMode, setMemberMode] = useState<"add" | "edit">("add");
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [removingMember, setRemovingMember] = useState<ProjectMember | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<"overview" | "tasks" | "team" | "activity">("overview");
  const [workspaceUsers, setWorkspaceUsers] = useState<WorkspaceUser[]>([]);
  const detailsRef = useRef<HTMLDivElement | null>(null);
  const [detailsHighlight, setDetailsHighlight] = useState(false);

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return projects
      .filter((project) => {
        if (statusFilter !== "ALL" && (project.status ?? "ACTIVE") !== statusFilter) {
          return false;
        }

        if (healthFilter !== "ALL" && project.stats.coordinationHealth !== healthFilter) {
          return false;
        }

        if (!normalized) {
          return true;
        }

        const haystack = [
          project.name,
          project.description ?? "",
          project.organization?.name ?? "",
          project.stats.coordinationReason,
          project.stats.coordinationHealth,
          project.slug ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalized);
      })
      .map((project) => ({
        ...project,
        isActive: project.id === activeProjectId,
      }));
  }, [activeProjectId, healthFilter, projects, search, statusFilter]);

  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "ALL" || healthFilter !== "ALL";
  const createDefaultOrgId = editingProject?.orgId ?? selectedProject?.orgId ?? projects[0]?.orgId ?? getActiveOrgIdFromAccessToken() ?? "";

  async function handleCreateProject(input: CreateProjectInput | UpdateProjectInput) {
    const project = await createNewProject(input as CreateProjectInput);
    void queryClient.invalidateQueries({ queryKey: eventQueryKey("organization", project.orgId) });
    toast({
      title: "Project created",
      description: project.name,
      variant: "success",
    });
  }

  async function handleUpdateProject(input: CreateProjectInput | UpdateProjectInput) {
    if (!editingProject) {
      return;
    }

    await updateExistingProject(editingProject.id, input as UpdateProjectInput);
    void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", editingProject.id) });
    void queryClient.invalidateQueries({ queryKey: eventQueryKey("organization", editingProject.orgId) });
    setEditingProject(null);
    toast({
      title: "Project updated",
      description: editingProject.name,
      variant: "success",
    });
  }

  async function handleDeleteProject(project: ProjectWithStats) {
    const confirmed = window.confirm(`Delete project \"${project.name}\"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await removeProject(project.id);
      toast({
        title: "Project deleted",
        description: project.name,
        variant: "success",
      });
    } catch (deleteError) {
      toast({
        title: "Project delete failed",
        description: getApiErrorMessage(deleteError, "Unable to delete this project."),
        variant: "error",
      });
    }
  }

  async function handleArchiveProject() {
    if (!selectedProject) return;
    try {
      await updateExistingProject(selectedProject.id, { status: "ARCHIVED" });
      void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", selectedProject.id) });
      void queryClient.invalidateQueries({ queryKey: eventQueryKey("organization", selectedProject.orgId) });
      toast({ title: "Project archived", description: selectedProject.name, variant: "success" });
      await refresh();
    } catch (err) {
      toast({ title: "Archive failed", description: getApiErrorMessage(err, "Unable to archive project."), variant: "error" });
    }
  }

  async function handleChangeLead(userId: string) {
    if (!selectedProject || !userId) return;
    try {
      const prevLead = (selectedProject.members ?? []).find((m) => m.role === "Tech Lead");
      if (prevLead && prevLead.userId !== userId) {
        await updateProjectMember(selectedProject.id, prevLead.userId, { role: "Member" });
      }

      const existing = (selectedProject.members ?? []).find((m) => m.userId === userId);
      if (existing) {
        await updateProjectMember(selectedProject.id, userId, { role: "Tech Lead" });
      } else {
        await addProjectMember(selectedProject.id, { userId, role: "Tech Lead", skills: [] });
      }

      void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", selectedProject.id) });
      void queryClient.invalidateQueries({ queryKey: eventQueryKey("organization", selectedProject.orgId) });
      toast({ title: "Project lead updated", description: "Project lead changed.", variant: "success" });
      await refresh();
    } catch (err) {
      toast({ title: "Update failed", description: getApiErrorMessage(err, "Unable to change project lead."), variant: "error" });
    }
  }

  async function handleAddMember(input: { userId: string; roleId?: string | null; role?: string; skillIds?: string[] }) {
    if (!selectedProject) return;
    await addProjectMember(selectedProject.id, input);
    await refresh();
    void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", selectedProject.id) });
    void queryClient.invalidateQueries({ queryKey: eventQueryKey("organization", selectedProject.orgId) });
    toast({
      title: "Member added",
      description: "Team roster updated.",
      variant: "success",
    });
  }

  async function handleEditMember(input: { userId: string; roleId?: string | null; role?: string; skillIds?: string[] }) {
    if (!selectedProject || !editingMember) return;
    await updateProjectMember(selectedProject.id, editingMember.userId, input);
    void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", selectedProject.id) });
    void queryClient.invalidateQueries({ queryKey: eventQueryKey("organization", selectedProject.orgId) });
    setEditingMember(null);
    await refresh();
    toast({
      title: "Member updated",
      description: "Role and skills saved.",
      variant: "success",
    });
  }

  const removeMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      await removeProjectMember(projectId, userId);
      return { projectId, userId };
    },
    onMutate: async ({ projectId, userId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });

      const previousProjects = queryClient.getQueryData<ProjectWithStats[]>(queryKeys.projects) ?? [];
      const nextProjects = previousProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              members: (project.members ?? []).filter((member) => member.userId !== userId),
            }
          : project
      );

      queryClient.setQueryData(queryKeys.projects, nextProjects);

      return { previousProjects };
    },
    onError: (_, __, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects);
      }
    },
    onSuccess: () => {
      setRemovingMember(null);
      if (selectedProject) {
        void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", selectedProject.id) });
        void queryClient.invalidateQueries({ queryKey: eventQueryKey("organization", selectedProject.orgId) });
      }
      toast({
        title: "Member removed",
        description: "Project membership deleted.",
        variant: "success",
      });
    },
  });

  async function handleRemoveMember(member: { userId: string; user?: { name?: string | null } }) {
    if (!selectedProject) return;
    await removeMemberMutation.mutateAsync({ projectId: selectedProject.id, userId: member.userId });
  }

  useEffect(() => {
    void getUsers().then(setWorkspaceUsers).catch(() => setWorkspaceUsers([]));
  }, []);

  useEffect(() => {
    function onViewProject(e: Event) {
      const ce = e as CustomEvent<{ projectId: string; activeTab?: string }>;
      const projectId = ce?.detail?.projectId;
      if (!projectId) return;
      // ensure project selected
      try {
        selectProject(projectId);
      } catch (err) {
        // noop
      }

      // switch to requested tab (fall back to overview)
      const requested = ce?.detail?.activeTab as
        | "overview"
        | "tasks"
        | "team"
        | "activity"
        | undefined;
      setActiveDetailsTab(requested ?? "overview");

      // scroll details into view and flash
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        setDetailsHighlight(true);
        setTimeout(() => setDetailsHighlight(false), 2000);
      }, 50);
    }

    window.addEventListener("view-project", onViewProject as EventListener);
    return () => window.removeEventListener("view-project", onViewProject as EventListener);
  }, [selectProject]);

  if (loading && projects.length === 0) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <ProjectSkeleton />
      </div>
    );
  }

  if (error && projects.length === 0) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8">
        <ProjectErrorState message={error} onRetry={() => void refresh()} />
      </div>
    );
  }

  return (
    <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="hidden-scrollbar space-y-6 px-4 py-6 md:px-8 md:py-8">
        <section className="space-y-3">
          <p className="text-sm uppercase tracking-[0.22em] text-violet-200/80">Project Management</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Manage projects with live coordination intelligence.</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/65 md:text-base">
                Track project health, blocked work, and active progress across the Explanify workspace.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
              Active project: <span className="text-white">{selectedProject?.name ?? "Not selected"}</span>
            </div>
          </div>
        </section>

        <ProjectStats projects={projects} />

        <ProjectToolbar
          search={search}
          viewMode={viewMode}
          statusFilter={statusFilter}
          healthFilter={healthFilter}
          onSearchChange={setSearch}
          onViewModeChange={setViewMode}
          onStatusFilterChange={setStatusFilter}
          onHealthFilterChange={setHealthFilter}
          onCreateProject={() => setIsCreateOpen(true)}
        />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.86fr)_minmax(0,1fr)] xl:items-start">
          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <ProjectEmptyState
                title={hasActiveFilters ? "No matching projects" : "No projects found"}
                description={
                  hasActiveFilters
                    ? "Adjust the current search or filters to see more live projects."
                    : "Create a new project to start tracking tasks, dependencies, and AI coordination health."
                }
                detail={
                  hasActiveFilters
                    ? "The project cache is still preserved; only the current view is filtered."
                    : "Projects will appear here once the backend returns live records."
                }
              />
            ) : viewMode === "grid" ? (
              <div className="grid gap-3 xl:grid-cols-[repeat(2,minmax(0,1fr))]">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={selectProject}
                    onEdit={setEditingProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onSelect={selectProject}
                    onEdit={setEditingProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </div>

          <div ref={detailsRef} className={`space-y-4 ${detailsHighlight ? "ring-2 ring-violet-400/30 rounded-xl" : ""}`}>
            <ProjectInsightsCard
              project={selectedProject}
              activeTab={activeDetailsTab}
              onTabChange={setActiveDetailsTab}
              onAddMember={() => {
                setMemberMode("add");
                setEditingMember(null);
                setIsMemberOpen(true);
              }}
              onEditMember={(member) => {
                setMemberMode("edit");
                setEditingMember(member);
                setIsMemberOpen(true);
              }}
              onRemoveMember={(member) => setRemovingMember(member)}
              onEditProject={() => selectedProject && setEditingProject(selectedProject)}
              onArchiveProject={handleArchiveProject}
              onDeleteProject={() => selectedProject && void handleDeleteProject(selectedProject)}
              onChangeLead={handleChangeLead}
            />
          </div>
        </div>

        <ProjectFormModal
          open={isCreateOpen}
          mode="create"
          defaultOrgId={createDefaultOrgId}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateProject}
        />

        <ProjectFormModal
          open={Boolean(editingProject)}
          mode="edit"
          project={editingProject}
          defaultOrgId={editingProject?.orgId ?? undefined}
          onClose={() => setEditingProject(null)}
          onSubmit={handleUpdateProject}
        />

        <ProjectMemberModal
          open={isMemberOpen}
          users={workspaceUsers}
          mode={memberMode}
          member={editingMember}
          onClose={() => setIsMemberOpen(false)}
          onSubmit={memberMode === "add" ? handleAddMember : handleEditMember}
        />

        <Dialog
          open={Boolean(removingMember)}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setRemovingMember(null);
            }
          }}
          title="Remove member"
          description={`Remove ${removingMember?.user?.name ?? "this member"} from the project? This only removes their project membership.`}
          size="md"
        >
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRemovingMember(null);
              }}
              disabled={removeMemberMutation.isPending}
              className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => removingMember && void handleRemoveMember(removingMember)}
              disabled={removeMemberMutation.isPending}
              className="rounded-2xl border-red-400/15 bg-red-500/10 text-red-100 hover:bg-red-500/20 disabled:opacity-50"
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove"}
            </Button>
          </div>
        </Dialog>
      </motion.main>
  );
}

export { ProjectsPage };
