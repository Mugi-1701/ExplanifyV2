"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getTasks } from "@/services/task.service";
import {
  ACTIVE_PROJECT_CHANGED_EVENT,
  clearActiveProjectId,
  createProject,
  deleteProject,
  getActiveProjectId,
  getProjects,
  setActiveProjectId,
  updateProject,
} from "@/services/project.service";
import { keepPreviousData, queryClient as sharedQueryClient, queryDefaults, queryKeys } from "@/lib/query-client";
import { useActiveProjectId } from "@/hooks/use-active-project-id";
import type { CreateProjectInput, Project, ProjectStats, ProjectWithStats, UpdateProjectInput } from "@/types/project";
import type { Task } from "@/types/task";

type UseProjectsResult = {
  projects: ProjectWithStats[];
  activeProjectId: string | null;
  selectedProject: ProjectWithStats | null;
  loading: boolean;
  error: string | null;
  isFetching: boolean;
  refresh: () => Promise<void>;
  selectProject: (projectId: string) => void;
  createNewProject: (input: CreateProjectInput) => Promise<Project>;
  updateExistingProject: (projectId: string, input: UpdateProjectInput) => Promise<Project>;
  removeProject: (projectId: string) => Promise<void>;
};

const EMPTY_STATS: ProjectStats = {
  taskCount: 0,
  completedTaskCount: 0,
  blockedTaskCount: 0,
  activeTaskCount: 0,
  coordinationHealth: "EMPTY",
  coordinationReason: "No tasks yet",
};

function normalizeProjectStats(stats?: ProjectStats | null): ProjectStats {
  if (!stats) {
    return EMPTY_STATS;
  }

  return {
    taskCount: Number(stats.taskCount) || 0,
    completedTaskCount: Number(stats.completedTaskCount) || 0,
    blockedTaskCount: Number(stats.blockedTaskCount) || 0,
    activeTaskCount: Number(stats.activeTaskCount) || 0,
    coordinationHealth: stats.coordinationHealth ?? "EMPTY",
    coordinationReason: stats.coordinationReason || "No tasks yet",
  };
}

function markActiveProject(projects: ProjectWithStats[], activeProjectId: string | null) {
  return projects.map((project) => ({
    ...project,
    isActive: project.id === activeProjectId,
  }));
}

function buildProjectStats(tasks: Task[]): ProjectStats {
  const taskCount = tasks.length;
  const completedTaskCount = tasks.filter((task) => task.status === "DONE").length;
  const blockedTaskCount = tasks.filter((task) => task.isBlocked || task.status === "BLOCKED").length;
  const activeTaskCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;

  if (taskCount === 0) {
    return {
      taskCount,
      completedTaskCount,
      blockedTaskCount,
      activeTaskCount,
      coordinationHealth: "EMPTY",
      coordinationReason: "No tasks yet",
    };
  }

  if (blockedTaskCount > 0) {
    return {
      taskCount,
      completedTaskCount,
      blockedTaskCount,
      activeTaskCount,
      coordinationHealth: "BLOCKED",
      coordinationReason: `${blockedTaskCount} task${blockedTaskCount === 1 ? " is" : "s are"} waiting on dependencies`,
    };
  }

  if (completedTaskCount === taskCount) {
    return {
      taskCount,
      completedTaskCount,
      blockedTaskCount,
      activeTaskCount,
      coordinationHealth: "HEALTHY",
      coordinationReason: "All dependencies completed",
    };
  }

  if (activeTaskCount > 0) {
    return {
      taskCount,
      completedTaskCount,
      blockedTaskCount,
      activeTaskCount,
      coordinationHealth: "READY",
      coordinationReason: "Active execution in progress",
    };
  }

  return {
    taskCount,
    completedTaskCount,
    blockedTaskCount,
    activeTaskCount,
    coordinationHealth: "READY",
    coordinationReason: "Ready to start",
  };
}

async function fetchProjectsWithStats(): Promise<ProjectWithStats[]> {
  const rawProjects = await getProjects();
  const safeProjects = Array.isArray(rawProjects) ? rawProjects : [];

  const projectSummaries = await Promise.all(
    safeProjects.map(async (project) => {
      if (project.stats) {
        return {
          project,
          stats: normalizeProjectStats(project.stats),
        };
      }

      const cachedTasks = sharedQueryClient.getQueryData<Task[]>(queryKeys.tasks(project.id));

      if (cachedTasks !== undefined) {
        return {
          project,
          stats: buildProjectStats(cachedTasks),
        };
      }

      try {
        const tasks = await getTasks(project.id);
        sharedQueryClient.setQueryData<Task[]>(queryKeys.tasks(project.id), tasks);
        return {
          project,
          stats: buildProjectStats(tasks),
        };
      } catch {
        return {
          project,
          stats: buildProjectStats([]),
        };
      }
    })
  );

  return projectSummaries.map(({ project, stats }) => ({
    ...project,
    isActive: false,
    stats,
  }));
}

function useProjects(): UseProjectsResult {
  const queryClient = useQueryClient();
  const activeProjectId = useActiveProjectId();

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjectsWithStats,
    staleTime: queryDefaults.staleTime,
    gcTime: queryDefaults.gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const projects = useMemo(() => {
    const data = projectsQuery.data ?? [];
    return markActiveProject(data, activeProjectId);
  }, [activeProjectId, projectsQuery.data]);

  const prefetchProjectTasks = useCallback(
    (projectId: string) => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.tasks(projectId),
        queryFn: () => getTasks(projectId),
        staleTime: queryDefaults.staleTime,
        gcTime: queryDefaults.gcTime,
        retry: 1,
      });
    },
    [queryClient]
  );

  useEffect(() => {
    if (projects.length === 0) {
      if (activeProjectId) {
        clearActiveProjectId();
      }
      return;
    }

    const activeProjectExists = activeProjectId ? projects.some((project) => project.id === activeProjectId) : false;

    if (!activeProjectExists) {
      setActiveProjectId(projects[0].id);
      prefetchProjectTasks(projects[0].id);
    }
  }, [activeProjectId, prefetchProjectTasks, projects]);

  useEffect(() => {
    const syncActiveProject = () => {
      const nextActiveProjectId = getActiveProjectId() ?? null;
      queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, (current = []) =>
        markActiveProject(current, nextActiveProjectId)
      );
    };

    window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, syncActiveProject as EventListener);

    return () => {
      window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, syncActiveProject as EventListener);
    };
  }, [queryClient]);

  const selectProject = useCallback(
    (projectId: string) => {
      setActiveProjectId(projectId);
      prefetchProjectTasks(projectId);
      queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, (current = []) => markActiveProject(current, projectId));
    },
    [prefetchProjectTasks, queryClient]
  );

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onMutate: async (input: CreateProjectInput) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });

      const previousProjects = queryClient.getQueryData<ProjectWithStats[]>(queryKeys.projects) ?? [];
      const optimisticProject: ProjectWithStats = {
        id: `optimistic-project-${Date.now()}`,
        name: input.name,
        slug: input.slug ?? null,
        description: input.description ?? null,
        status: input.status ?? null,
        orgId: input.orgId,
        teamId: input.teamId ?? null,
        startDate: input.startDate ?? null,
        dueDate: input.dueDate ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: false,
        stats: EMPTY_STATS,
      };

      queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, [
        ...previousProjects,
        optimisticProject,
      ]);

      return { previousProjects, optimisticProjectId: optimisticProject.id };
    },
    onError: (_, _input, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects);
      }
    },
    onSuccess: (project, _input, context) => {
      queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, (current = []) =>
        current.map((item) =>
          item.id === context?.optimisticProjectId
            ? {
                ...project,
                isActive: false,
                stats: project.stats ? normalizeProjectStats(project.stats) : item.stats ?? EMPTY_STATS,
              }
            : item
        )
      );

      selectProject(project.id);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: UpdateProjectInput }) =>
      updateProject(projectId, input),
    onMutate: async ({ projectId, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });

      const previousProjects = queryClient.getQueryData<ProjectWithStats[]>(queryKeys.projects) ?? [];

      queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, (current = []) =>
        current.map((project) =>
          project.id === projectId
            ? {
                ...project,
                ...input,
                updatedAt: new Date().toISOString(),
              }
            : project
        )
      );

      return { previousProjects };
    },
    onError: (_, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects);
      }
    },
    onSuccess: (project) => {
      queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, (current = []) =>
        current.map((item) =>
          item.id === project.id
            ? {
                ...item,
                ...project,
                stats: project.stats ? normalizeProjectStats(project.stats) : item.stats,
              }
            : item
        )
      );
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: deleteProject,
    onMutate: async (projectId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.projects });

      const previousProjects = queryClient.getQueryData<ProjectWithStats[]>(queryKeys.projects) ?? [];
      const nextProjects = previousProjects.filter((project) => project.id !== projectId);
      const nextActiveProjectId = activeProjectId === projectId ? nextProjects[0]?.id ?? null : activeProjectId;

      queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, markActiveProject(nextProjects, nextActiveProjectId));

      if (nextActiveProjectId) {
        setActiveProjectId(nextActiveProjectId);
      } else {
        clearActiveProjectId();
      }

      return { previousProjects, previousActiveProjectId: activeProjectId };
    },
    onError: (_, _projectId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKeys.projects, context.previousProjects);
      }

      if (context?.previousActiveProjectId) {
        setActiveProjectId(context.previousActiveProjectId);
      } else {
        clearActiveProjectId();
      }
    },
    onSuccess: (_result, projectId) => {
      queryClient.removeQueries({ queryKey: queryKeys.tasks(projectId), exact: true });
    },
  });

  const refresh = useCallback(async () => {
    await projectsQuery.refetch();
  }, [projectsQuery]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects]
  );

  return {
    projects,
    activeProjectId,
    selectedProject,
    loading: projectsQuery.isPending && projects.length === 0,
    error: projectsQuery.error instanceof Error ? projectsQuery.error.message : null,
    isFetching: projectsQuery.isFetching,
    refresh,
    selectProject,
    createNewProject: createProjectMutation.mutateAsync,
    updateExistingProject: (projectId: string, input: UpdateProjectInput) =>
      updateProjectMutation.mutateAsync({ projectId, input }),
    removeProject: deleteProjectMutation.mutateAsync,
  };
}

export { useProjects, buildProjectStats };
