"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { DashboardErrorCard } from "@/components/dashboard/dashboard-error-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { queryKeys } from "@/lib/query-client";
import { resolveProjectId } from "@/services/task.service";
import { useTasks } from "@/hooks/useTasks";
import { buildProjectStats } from "@/hooks/use-projects";
import { createTask, deleteTask, updateTask } from "@/services/task.service";
import type { CreateTaskInput, Task, UpdateTaskInput } from "@/types/task";
import type { ProjectWithStats } from "@/types/project";
import { TaskCreateForm } from "./task-create-form";
import { TaskEditModal } from "./task-edit-modal";
import { TaskCard } from "./task-card";
import { TaskEmptyState } from "./task-empty-state";
import { TaskPanel } from "./task-panel";
import { TaskTable } from "./task-table";
import { TaskToolbar } from "./task-toolbar";
import { sortTasksByPriority } from "./task-utils";

type TasksPageProps = {
  projectId?: string;
};

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

function TasksPage({ projectId }: TasksPageProps) {
  const queryClient = useQueryClient();
  const resolvedProjectId = useMemo(() => projectId ?? resolveProjectId() ?? null, [projectId]);
  const { tasks, loading, error, refetch, isFetching } = useTasks(resolvedProjectId ?? undefined);
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null,
    [selectedTaskId, tasks]
  );

  const filteredTasks = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const sorted = sortTasksByPriority(tasks);

    if (!normalized) {
      return sorted;
    }

    return sorted.filter((task) => {
      const haystack = [
        task.title,
        task.description ?? "",
        task.status,
        task.priority ?? "",
        task.coordinationReason ?? "",
        ...(task.blockingTasks ?? []).map((blockingTask) => `${blockingTask.title} ${blockingTask.status}`),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [search, tasks]);

  const blockedCount = filteredTasks.filter((task) => task.isBlocked).length;
  const completedCount = filteredTasks.filter((task) => task.status === "DONE").length;
  const activeCount = filteredTasks.filter((task) => task.status === "IN_PROGRESS").length;

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onMutate: async (input: CreateTaskInput) => {
      const projectIdForMutation = input.projectId || resolvedProjectId;

      if (!projectIdForMutation) {
        throw new Error("projectId is required");
      }

      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(projectIdForMutation) });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(projectIdForMutation)) ?? [];
      const optimisticTask: Task = {
        id: `optimistic-task-${Date.now()}`,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? "TODO",
        priority: input.priority ?? "MEDIUM",
        projectId: projectIdForMutation,
        isBlocked: false,
        blockingTasks: [],
        coordinationReason: "Queued for coordination",
        coordinationState: "READY",
        dependencies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(queryKeys.tasks(projectIdForMutation), [...previousTasks, optimisticTask]);
      updateProjectStatsCache(queryClient, projectIdForMutation);

      return { previousTasks, projectId: projectIdForMutation, optimisticTaskId: optimisticTask.id };
    },
    onError: (_, _input, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), context.previousTasks);
      updateProjectStatsCache(queryClient, context.projectId);
    },
    onSuccess: (task, _input, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), (current = []) =>
        current.map((item) => (item.id === context.optimisticTaskId ? task : item))
      );
      updateProjectStatsCache(queryClient, context.projectId);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => updateTask(taskId, input),
    onMutate: async ({ taskId, input }) => {
      const currentProjectId = input.projectId || resolvedProjectId;

      await Promise.all([
        currentProjectId ? queryClient.cancelQueries({ queryKey: queryKeys.tasks(currentProjectId) }) : Promise.resolve(),
        queryClient.cancelQueries({ queryKey: queryKeys.task(taskId) }),
      ]);

      const previousTasks = currentProjectId ? (queryClient.getQueryData<Task[]>(queryKeys.tasks(currentProjectId)) ?? []) : [];
      const sourceTask = previousTasks.find((task) => task.id === taskId);
      const targetProjectId = input.projectId || sourceTask?.projectId || currentProjectId || null;

      if (!targetProjectId) {
        throw new Error("projectId is required");
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(targetProjectId), (current = previousTasks) =>
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
      updateProjectStatsCache(queryClient, targetProjectId);

      return { previousTasks, projectId: targetProjectId, taskId };
    },
    onError: (_, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), context.previousTasks);
      updateProjectStatsCache(queryClient, context.projectId);
    },
    onSuccess: (task, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), (current = []) =>
        current.map((item) => (item.id === context.taskId ? task : item))
      );
      updateProjectStatsCache(queryClient, context.projectId);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId: string) => {
      const currentTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(resolvedProjectId)) ?? [];
      const removedTask = currentTasks.find((task) => task.id === taskId) ?? null;
      const projectForMutation = removedTask?.projectId || resolvedProjectId;

      if (!projectForMutation) {
        throw new Error("projectId is required");
      }

      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(projectForMutation) });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(projectForMutation)) ?? [];
      queryClient.setQueryData<Task[]>(queryKeys.tasks(projectForMutation), (current = previousTasks) =>
        current.filter((task) => task.id !== taskId)
      );
      updateProjectStatsCache(queryClient, projectForMutation);

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }

      if (editingTask?.id === taskId) {
        setEditingTask(null);
      }

      return { previousTasks, projectId: projectForMutation };
    },
    onError: (_, _taskId, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), context.previousTasks);
      updateProjectStatsCache(queryClient, context.projectId);
    },
    onSuccess: (_result, taskId, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), (current = []) =>
        current.filter((task) => task.id !== taskId)
      );
      updateProjectStatsCache(queryClient, context.projectId);
    },
  });

  async function handleCreate(input: CreateTaskInput) {
    await createTaskMutation.mutateAsync({
      ...input,
      projectId: input.projectId || resolvedProjectId || "",
    });
  }

  async function handleUpdateStatus(task: Task, status: Task["status"]) {
    await updateTaskMutation.mutateAsync({
      taskId: task.id,
      input: { status },
    });
  }

  async function handleUpdatePriority(task: Task, priority: NonNullable<CreateTaskInput["priority"]>) {
    await updateTaskMutation.mutateAsync({
      taskId: task.id,
      input: { priority },
    });
  }

  async function handleUpdateTask(input: UpdateTaskInput) {
    if (!editingTask) {
      return;
    }

    await updateTaskMutation.mutateAsync({
      taskId: editingTask.id,
      input,
    });
  }

  async function handleDelete(task: Task) {
    await deleteTaskMutation.mutateAsync(task.id);
  }

  const isSyncing = isFetching || createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending;

  if (loading && tasks.length === 0) {
    return <DashboardSkeleton />;
  }

  if (error && tasks.length === 0) {
    return <DashboardErrorCard message={error} onRetry={() => void refetch()} />;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6 px-4 py-6 md:px-8 md:py-8"
    >
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.22em] text-violet-200/80">Task Management</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Orchestrate tasks with live coordination.</h1>
            <p className="max-w-2xl text-sm leading-7 text-white/65 md:text-base">
              Search, create, update, and remove tasks while watching dependency intelligence and AI explanations update in real time.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
            Project: <span className="text-white">{resolvedProjectId ?? "Active project"}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-5">
            <p className="text-sm text-white/55">Total Tasks</p>
            <p className="mt-2 text-3xl font-semibold text-white">{filteredTasks.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-5">
            <p className="text-sm text-white/55">Completed</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-200">{completedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-5">
            <p className="text-sm text-white/55">Blocked</p>
            <p className="mt-2 text-3xl font-semibold text-amber-200">{blockedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-5">
            <p className="text-sm text-white/55">Active</p>
            <p className="mt-2 text-3xl font-semibold text-blue-200">{activeCount}</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <TaskToolbar search={search} onSearchChange={setSearch} onCreateTask={() => setSearch("")} />

          {filteredTasks.length === 0 ? (
            <TaskEmptyState />
          ) : (
            <div className="space-y-4">
              <div className="hidden xl:block">
                <TaskTable
                  tasks={filteredTasks}
                  onSelectTask={(task) => setSelectedTaskId(task.id)}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdatePriority={handleUpdatePriority}
                  onDelete={handleDelete}
                  onEdit={setEditingTask}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2 xl:hidden">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdatePriority={handleUpdatePriority}
                    onDelete={handleDelete}
                    onEdit={setEditingTask}
                  />
                ))}
              </div>

              <div className="hidden gap-4 lg:grid-cols-2 xl:grid">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdatePriority={handleUpdatePriority}
                    onDelete={handleDelete}
                    onEdit={setEditingTask}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TaskCreateForm projectId={resolvedProjectId ?? undefined} onCreate={handleCreate} />
          <TaskPanel task={selectedTask} onEdit={setEditingTask} />
          {isSyncing ? (
            <Card className="border-white/10 bg-white/[0.03]">
              <CardContent className="p-4 text-sm text-white/55">Syncing live task changes...</CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <TaskEditModal open={Boolean(editingTask)} task={editingTask} onClose={() => setEditingTask(null)} onSubmit={handleUpdateTask} />
    </motion.main>
  );
}

export { TasksPage };
