"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { ProjectCard } from "@/components/projects/project-card";
import { ProjectEmptyState } from "@/components/projects/project-empty-state";
import { ProjectErrorState } from "@/components/projects/project-error-state";
import { ProjectFormModal } from "@/components/projects/project-form-modal";
import { ProjectInsightsCard } from "@/components/projects/project-insights-card";
import { ProjectRow } from "@/components/projects/project-row";
import { ProjectSelector } from "@/components/projects/project-selector";
import { ProjectSkeleton } from "@/components/projects/project-skeleton";
import { ProjectStats } from "@/components/projects/project-stats";
import { ProjectToolbar } from "@/components/projects/project-toolbar";
import { useProjects } from "@/hooks/use-projects";
import type { CreateProjectInput, ProjectWithStats, UpdateProjectInput } from "@/types/project";

type ProjectsPageProps = {
  searchParams?: {
    projectId?: string | string[];
  };
};

function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { projects, activeProjectId, selectedProject, loading, error, refresh, selectProject, createNewProject, updateExistingProject, removeProject } = useProjects();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null);

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return projects
      .filter((project) => {
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
  }, [activeProjectId, projects, search]);

  const createDefaultOrgId = editingProject?.orgId ?? selectedProject?.orgId ?? projects[0]?.orgId ?? "";

  async function handleCreateProject(input: CreateProjectInput | UpdateProjectInput) {
    await createNewProject(input as CreateProjectInput);
  }

  async function handleUpdateProject(input: CreateProjectInput | UpdateProjectInput) {
    if (!editingProject) {
      return;
    }

    await updateExistingProject(editingProject.id, input as UpdateProjectInput);
    setEditingProject(null);
  }

  async function handleDeleteProject(project: ProjectWithStats) {
    const confirmed = window.confirm(`Delete project \"${project.name}\"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    await removeProject(project.id);
  }

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
    <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="space-y-6 px-4 py-6 md:px-8 md:py-8">
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

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-4">
            <ProjectToolbar
              search={search}
              viewMode={viewMode}
              onSearchChange={setSearch}
              onViewModeChange={setViewMode}
              onCreateProject={() => setIsCreateOpen(true)}
            />

            {filteredProjects.length === 0 ? (
              <ProjectEmptyState />
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 xl:grid-cols-2">
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
              <div className="space-y-4">
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

          <div className="space-y-4">
            <ProjectSelector projects={projects} activeProjectId={activeProjectId} onSelectProject={selectProject} />
            <ProjectInsightsCard project={selectedProject} />
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
      </motion.main>
  );
}

export { ProjectsPage };
