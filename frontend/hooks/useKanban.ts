"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useTasks } from "@/hooks/useTasks";
import { queryKeys } from "@/lib/query-client";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";
import { createTask, updateTask } from "@/services/task.service";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/types/task";
import { buildProjectStats } from "@/hooks/use-projects";
import { filterKanbanTasks, groupKanbanTasks, type KanbanBoardGroups, type KanbanPriorityFilter } from "@/services/kanban.service";
import type { ProjectWithStats } from "@/types/project";

type KanbanCreateTaskInput = Pick<CreateTaskInput, "title" | "description" | "priority" | "assigneeId" | "dueDate" | "estimateHours">;

type KanbanState = {
  tasks: Task[];
  filteredTasks: Task[];
  groupedTasks: KanbanBoardGroups;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  search: string;
  setSearch: (value: string) => void;
  priorityFilter: KanbanPriorityFilter;
  setPriorityFilter: (value: KanbanPriorityFilter) => void;
  canCreateTask: boolean;
  canUpdateTask: boolean;
  isMovingTask: boolean;
  isCreatingTask: boolean;
  moveTaskToColumn: (task: Task, nextStatus: Task["status"]) => Promise<void>;
  createBoardTask: (input: KanbanCreateTaskInput & { projectId: string }) => Promise<Task>;
};

const createOptimisticTask = (input: KanbanCreateTaskInput & { projectId: string }): Task => ({
  id: `optimistic-task-${Date.now()}`,
  title: input.title,
  description: input.description ?? null,
  requiredSkills: [],
  status: "TODO",
  priority: input.priority ?? "MEDIUM",
  dueDate: input.dueDate ?? null,
  estimateHours: input.estimateHours ?? null,
  projectId: input.projectId,
  assigneeId: input.assigneeId ?? null,
  isBlocked: false,
  blockingTasks: [],
  dependencies: [],
  coordinationReason: "Queued for Kanban",
  coordinationState: "READY",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

function updateProjectStatsCache(queryClient: ReturnType<typeof useQueryClient>, projectId: string) {
  const currentTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(projectId)) ?? [];

  queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, (current = []) =>
    current.map((project) =>
      project.id === projectId
        ? {
            ...project,
            stats: buildProjectStats(currentTasks),
          }
        : project
    )
  );
}

function syncProjectTasksCache(queryClient: ReturnType<typeof useQueryClient>, projectId: string) {
  const currentTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(projectId)) ?? [];

  queryClient.setQueryData<ProjectWithStats[]>(queryKeys.projects, (current = []) =>
    current.map((project) =>
      project.id === projectId
        ? {
            ...project,
            tasks: currentTasks,
          }
        : project
    )
  );
}

async function invalidateKanbanInsights(queryClient: ReturnType<typeof useQueryClient>, projectId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectId), refetchType: "active" }),
    queryClient.invalidateQueries({ queryKey: queryKeys.aiKanbanInsights(projectId), refetchType: "active" }),
    queryClient.invalidateQueries({ queryKey: queryKeys.aiWorkloadAnalysis(projectId), refetchType: "active" }),
  ]);
}

function useKanban(projectId?: string): KanbanState {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = useRole();
  const { tasks, loading, error, refetch } = useTasks(projectId);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<KanbanPriorityFilter>("ALL");

  const canCreateTask = hasPermission(role, PERMISSIONS.CREATE_TASK);
  const canUpdateTask = hasPermission(role, PERMISSIONS.UPDATE_TASK);

  const filteredTasks = useMemo(
    () =>
      filterKanbanTasks(tasks, {
        search,
        priority: priorityFilter,
        currentUserId: user?.id ?? null,
      }),
    [priorityFilter, search, tasks, user?.id]
  );

  const groupedTasks = useMemo(() => groupKanbanTasks(filteredTasks), [filteredTasks]);

  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => updateTask(taskId, input),
    onMutate: async ({ taskId, input }) => {
      const projectIdForMutation = input.projectId || projectId;

      if (!projectIdForMutation) {
        throw new Error("projectId is required");
      }

      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(projectIdForMutation) });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(projectIdForMutation)) ?? [];

      queryClient.setQueryData<Task[]>(queryKeys.tasks(projectIdForMutation), (current = previousTasks) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...input,
                description: input.description ?? task.description ?? null,
                priority: input.priority ?? task.priority ?? "MEDIUM",
                updatedAt: new Date().toISOString(),
              }
            : task
        )
      );
      updateProjectStatsCache(queryClient, projectIdForMutation);
      syncProjectTasksCache(queryClient, projectIdForMutation);

      return { previousTasks, projectId: projectIdForMutation, taskId };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), context.previousTasks);
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
    },
    onSuccess: (task, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), (current = []) =>
        current.map((item) => (item.id === context.taskId ? task : item))
      );
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
      void invalidateKanbanInsights(queryClient, context.projectId);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onMutate: async (input: CreateTaskInput) => {
      const projectIdForMutation = input.projectId || projectId;

      if (!projectIdForMutation) {
        throw new Error("projectId is required");
      }

      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(projectIdForMutation) });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(projectIdForMutation)) ?? [];
      const optimisticTask = createOptimisticTask({
        projectId: projectIdForMutation,
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
        estimateHours: input.estimateHours,
      });

      queryClient.setQueryData<Task[]>(queryKeys.tasks(projectIdForMutation), [...previousTasks, optimisticTask]);
      updateProjectStatsCache(queryClient, projectIdForMutation);
      syncProjectTasksCache(queryClient, projectIdForMutation);

      return { previousTasks, projectId: projectIdForMutation, optimisticTaskId: optimisticTask.id };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), context.previousTasks);
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
    },
    onSuccess: (task, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), (current = []) =>
        current.map((item) => (item.id === context.optimisticTaskId ? task : item))
      );
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
      void invalidateKanbanInsights(queryClient, context.projectId);
    },
  });

  const moveTaskToColumn = async (task: Task, nextStatus: Task["status"]) => {
    if (!canUpdateTask || task.status === nextStatus) {
      return;
    }

    await moveTaskMutation.mutateAsync({
      taskId: task.id,
      input: {
        status: nextStatus,
      },
    });
  };

  const createBoardTask = async (input: KanbanCreateTaskInput & { projectId: string }) => {
    if (!canCreateTask) {
      throw new Error("You do not have permission to create tasks");
    }

    return createTaskMutation.mutateAsync({
      title: input.title,
      description: input.description,
      priority: input.priority,
      assigneeId: input.assigneeId || undefined,
      dueDate: input.dueDate || undefined,
      estimateHours: input.estimateHours || undefined,
      projectId: input.projectId,
      status: "TODO",
    });
  };

  return {
    tasks,
    filteredTasks,
    groupedTasks,
    loading,
    error,
    refetch,
    search,
    setSearch,
    priorityFilter,
    setPriorityFilter,
    canCreateTask,
    canUpdateTask,
    isMovingTask: moveTaskMutation.isPending,
    isCreatingTask: createTaskMutation.isPending,
    moveTaskToColumn,
    createBoardTask,
  };
}

export { useKanban };
export type { KanbanCreateTaskInput, KanbanState };
