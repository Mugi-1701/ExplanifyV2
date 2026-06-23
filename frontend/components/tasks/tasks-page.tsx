"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { DashboardErrorCard } from "@/components/dashboard/dashboard-error-card";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api-errors";
import { queryKeys } from "@/lib/query-client";
import { resolveProjectId } from "@/services/task.service";
import { useTasks } from "@/hooks/useTasks";
import { useCoordinationSuggestion } from "@/hooks/useCoordinationSuggestion";
import { buildProjectStats, useProjects } from "@/hooks/use-projects";
import { useProjectDisplayName } from "@/hooks/use-project-display-name";
import { createTask, deleteTask, scheduleTask as scheduleTaskRequest, updateTask } from "@/services/task.service";
import type { CreateTaskInput, ScheduleTaskInput, Task, UpdateTaskInput } from "@/types/task";
import type { ProjectWithStats } from "@/types/project";
import { TaskCreateModal } from "./task-create-modal";
import { TaskEmptyState } from "./task-empty-state";
import { TaskTable } from "./task-table";
import { TaskToolbar } from "./task-toolbar";
import { CoordinationInsights } from "./coordination-insights";
import { TaskDetailModal } from "./task-detail-modal";
import { TaskScheduleModal } from "./task-schedule-modal";
import { SmartCoordinationToast } from "@/components/coordination/smart-coordination-toast";
import { AIStatusSuggestionPopup } from "@/components/coordination/ai-status-suggestion-popup";
import { useSmartStatusEngine, type SmartStatusSuggestion } from "@/hooks/useSmartStatusEngine";
import { sortTasksByPriority } from "./task-utils";
import { eventQueryKey } from "@/components/events/hooks/use-activity-timeline";

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

function TasksPage({ projectId }: TasksPageProps) {
  // === HOOKS: queries first ===
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const resolvedProjectId = useMemo(() => projectId ?? resolveProjectId() ?? null, [projectId]);
  const projectName = useProjectDisplayName(resolvedProjectId);
  const { selectedProject } = useProjects();
  const {
    currentSuggestion,
    isOpen,
    handleDismiss,
    handleStartTask,
    showSuggestion,
  } = useCoordinationSuggestion(resolvedProjectId);
  const { tasks, loading, error, refetch } = useTasks(resolvedProjectId ?? undefined);
  const assignees = selectedProject?.members?.map((member) => ({
    id: member.userId,
    name: member.user?.name ?? "Unknown member",
    email: member.user?.email ?? "",
  })) ?? [];
  const hasProjectContext = Boolean(resolvedProjectId);

  // === AI STATUS ENGINE: Smart workflow assistance ===
  const [aiStatusSuggestion, setAiStatusSuggestion] = useState<SmartStatusSuggestion | null>(null);
  const [showAiStatusPopup, setShowAiStatusPopup] = useState(false);
  const [aiStatusLoading, setAiStatusLoading] = useState(false);

  const { recordInteraction, recordStatusChange, resetActivityForStatusChange, applySuggestion, isSuppressed } = useSmartStatusEngine(
    tasks,
    resolvedProjectId,
    (suggestion) => {
      setAiStatusSuggestion(suggestion);
      setShowAiStatusPopup(true);
    }
  );

  // === STATE: component UI state (before mutations so they can reference state) ===
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Task["status"]>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | NonNullable<CreateTaskInput["priority"]>>("ALL");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const prevCoordinationMapRef = useRef<Map<string, string>>(new Map());
  const initialMountRef = useRef(true);
  const [showSyncing, setShowSyncing] = useState(false);

  // === MUTATIONS: declare all mutations after state ===
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onMutate: async (input: CreateTaskInput) => {
      // Temporary presentation-mode telemetry
      // eslint-disable-next-line no-console
      console.log("[perf] mutation started: createTask");
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
        requiredSkills: input.requiredSkills ?? [],
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
      syncProjectTasksCache(queryClient, projectIdForMutation);

      return { previousTasks, projectId: projectIdForMutation, optimisticTaskId: optimisticTask.id };
    },
    onError: (mutationError, _input, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), context.previousTasks);
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
      toast({
        title: "Task was not created",
        description: getApiErrorMessage(mutationError, "The optimistic change was rolled back."),
        variant: "error",
      });
    },
    onSuccess: (task, _input, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), (current = []) =>
        current.map((item) => (item.id === context.optimisticTaskId ? task : item))
      );
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(context.projectId), refetchType: "active" });
      void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", context.projectId) });
      recordInteraction(task.id);
      // eslint-disable-next-line no-console
      console.log("[perf] mutation finished: createTask");
      toast({
        title: "Task created",
        description: task.title,
        variant: "success",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => updateTask(taskId, input),
    onMutate: async ({ taskId, input }) => {
      // eslint-disable-next-line no-console
      console.log("[perf] mutation started: updateTask");
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
    onError: (mutationError, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), context.previousTasks);
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
      toast({
        title: "Task update reverted",
        description: getApiErrorMessage(mutationError, "The backend rejected this change."),
        variant: "error",
      });
    },
    onSuccess: (task, variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), (current = []) =>
        current.map((item) => (item.id === context.taskId ? task : item))
      );
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
      void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", context.projectId) });

      if (variables.input.status !== undefined) {
        resetActivityForStatusChange(variables.taskId, task.status);
      }

      recordInteraction(variables.taskId);

      if (variables.input.title !== undefined || variables.input.description !== undefined) {
        toast({
          title: "Task updated",
          description: task.title,
          variant: "success",
        });
      }
      // eslint-disable-next-line no-console
      console.log("[perf] mutation finished: updateTask");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onMutate: async (taskId: string) => {
      // eslint-disable-next-line no-console
      console.log("[perf] mutation started: deleteTask");
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
      syncProjectTasksCache(queryClient, projectForMutation);

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }

      return { previousTasks, projectId: projectForMutation };
    },
    onError: (mutationError, _taskId, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), context.previousTasks);
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
      toast({
        title: "Task delete reverted",
        description: getApiErrorMessage(mutationError, "The backend rejected this change."),
        variant: "error",
      });
    },
    onSuccess: (_result, taskId, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<Task[]>(queryKeys.tasks(context.projectId), (current = []) =>
        current.filter((task) => task.id !== taskId)
      );
      updateProjectStatsCache(queryClient, context.projectId);
      syncProjectTasksCache(queryClient, context.projectId);
      void queryClient.invalidateQueries({ queryKey: eventQueryKey("project", context.projectId) });
      toast({
        title: "Task deleted",
        variant: "success",
      });
      // eslint-disable-next-line no-console
      console.log("[perf] mutation finished: deleteTask");
    },
  });

  const scheduleTaskMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: ScheduleTaskInput }) => scheduleTaskRequest(taskId, input),
    onSuccess: async (result) => {
      queryClient.setQueryData<Task[]>(queryKeys.tasks(result.task.projectId ?? resolvedProjectId), (current = []) =>
        current.map((task) => (task.id === result.task.id ? result.task : task))
      );
      if (result.task.projectId ?? resolvedProjectId) {
        const projectKey = result.task.projectId ?? resolvedProjectId!;
        updateProjectStatsCache(queryClient, projectKey);
        syncProjectTasksCache(queryClient, projectKey);
        void queryClient.invalidateQueries({ queryKey: queryKeys.tasks(projectKey) });
      }
      toast({
        title: "Task scheduled",
        description: result.task.title,
        variant: "success",
      });
      setIsScheduleOpen(false);
      // eslint-disable-next-line no-console
      console.log("[perf] mutation finished: scheduleTask");
    },
    onError: (mutationError) => {
      toast({
        title: "Scheduling failed",
        description: getApiErrorMessage(mutationError, "Unable to schedule this task."),
        variant: "error",
      });
    },
  });

  // === DERIVED STATE: computed values ===
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks]
  );

  const filteredTasks = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const sorted = sortTasksByPriority(tasks);

    return sorted.filter((task) => {
      if (statusFilter !== "ALL" && task.status !== statusFilter) {
        return false;
      }

      if (priorityFilter !== "ALL" && (task.priority ?? "MEDIUM") !== priorityFilter) {
        return false;
      }

      if (!normalized) {
        return true;
      }

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
  }, [priorityFilter, search, statusFilter, tasks]);

  const blockedCount = tasks.filter((task) => task.isBlocked || task.status === "BLOCKED").length;
  const completedCount = tasks.filter((task) => task.status === "DONE").length;
  const activeCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const hasActiveFilters = Boolean(search.trim()) || statusFilter !== "ALL" || priorityFilter !== "ALL";

  // === EFFECTS: side effects dependent on mutations ===
  useEffect(() => {
    if (tasks.length > 0) {
      console.log("[TasksPage] tasks snapshot", tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        coordinationState: task.coordinationState,
        isBlocked: task.isBlocked,
        dependencies: task.dependencies,
        dependencyIds: task.dependencies?.map((dependency) => dependency.dependsOnTaskId) ?? [],
        dependencyCount: task.dependencies?.length ?? 0,
        blockingTaskCount: task.blockingTasks?.length ?? 0,
      })));
    }
  }, [tasks]);

  useEffect(() => {
    if (resolvedProjectId) {
      updateProjectStatsCache(queryClient, resolvedProjectId);
    }
  }, [queryClient, resolvedProjectId, tasks]);

  const handleRefetch = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.log("[perf] refetch started: tasks");
    await refetch();
    // eslint-disable-next-line no-console
    console.log("[perf] refetch finished: tasks");
  }, [refetch]);

  // Detect coordination state transitions and trigger suggestion popups
  useEffect(() => {
    // Build current mapping of taskId -> coordinationState
    const currentMap = new Map<string, string>();
    for (const t of tasks) {
      const state = t.coordinationState ?? (t.isBlocked ? "BLOCKED" : "READY");
      currentMap.set(t.id, state);
    }

    // Don't trigger on initial mount — just record snapshot
    if (initialMountRef.current) {
      prevCoordinationMapRef.current = currentMap;
      initialMountRef.current = false;
      return;
    }

    // Compare previous -> current and show suggestion for target transitions
    for (const t of tasks) {
      const prev = prevCoordinationMapRef.current.get(t.id) ?? null;
      const curr = currentMap.get(t.id) ?? null;

      if (!prev || !curr || prev === curr) continue;

      const transition = `${prev}->${curr}`;

      const isBlockedToReady = prev === "BLOCKED" && curr === "READY";
      const isReadyToBlocked = prev === "READY" && curr === "BLOCKED";
      const isTodoToReady = t.status === "TODO" && curr === "READY" && prev !== "READY";
      const isInProgressToReady = t.status === "IN_PROGRESS" && curr === "READY" && prev !== "READY";

      if (isBlockedToReady || isReadyToBlocked || isTodoToReady || isInProgressToReady) {
        const suggestion = {
          signal: transition,
          taskId: t.id,
          taskTitle: t.title,
          reason: t.coordinationReason ?? (isBlockedToReady ? "Ready to start" : "Coordination changed"),
          completedDependencyTitle: t.coordinationReason ?? undefined,
          blockingTaskCount: t.blockingTasks?.length ?? 0,
        };

        // Show the suggestion (this will open the toast) unless suppressed
        try {
          if (typeof isSuppressed === "function" && isSuppressed(t.id)) {
            // Suppressed due to recent user pause — skip showing suggestion
          } else {
            showSuggestion(suggestion as any);
          }
        } catch (e) {
          // swallow — suggestion showing is non-critical
        }
      }
    }

    // Update prev snapshot for next run
    prevCoordinationMapRef.current = currentMap;
  }, [tasks, showSuggestion]);

  // Show syncing indicator only if operations take longer than 400ms
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending) {
      timer = setTimeout(() => setShowSyncing(true), 400);
    } else {
      setShowSyncing(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [createTaskMutation.isPending, updateTaskMutation.isPending, deleteTaskMutation.isPending]);

  // === HANDLERS: async handlers using mutations ===
  async function handleCreate(input: CreateTaskInput) {
    await createTaskMutation.mutateAsync({
      ...input,
      projectId: input.projectId || resolvedProjectId || "",
    });
  }

  async function handleUpdateStatus(task: Task, status: Task["status"]) {
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        input: { status },
      });
    } catch {
      // Mutation error toast and cache rollback are handled centrally.
    }
  }

  async function handleUpdatePriority(task: Task, priority: NonNullable<CreateTaskInput["priority"]>) {
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        input: { priority },
      });
    } catch {
      // Mutation error toast and cache rollback are handled centrally.
    }
  }

  async function handleUpdateTask(input: UpdateTaskInput) {
    if (!selectedTaskId) {
      return;
    }

    await updateTaskMutation.mutateAsync({
      taskId: selectedTaskId,
      input,
    });
  }

  async function handleDelete(task: Task) {
    try {
      await deleteTaskMutation.mutateAsync(task.id);
    } catch {
      // Mutation error toast and cache rollback are handled centrally.
    }
  }

  const isSyncing = createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending;

  const handleTaskStarted = useCallback((taskId: string) => {
    // Scroll task into view by selecting it (will display in task panel)
    setSelectedTaskId(taskId);
    recordInteraction(taskId);
    recordStatusChange(taskId);
    // Optional: could add a brief highlight animation here via ref or state
  }, [recordInteraction, recordStatusChange]);

  const handleDismissAiStatusSuggestion = useCallback(() => {
    setShowAiStatusPopup(false);
    setAiStatusSuggestion(null);
  }, []);

  const handleApplyAiStatusSuggestion = useCallback(
    async (
      action:
        | "MOVE_TO_REVIEW"
        | "PAUSE_TASK"
        | "KEEP_WORKING"
        | "MARK_COMPLETE"
        | "RESUME"
        | "ARCHIVE"
        | "IGNORE"
    ) => {
      if (!aiStatusSuggestion) {
        return;
      }

      setAiStatusLoading(true);

      // Start transition optimistically and close the popup quickly.
      try {
        const promise = applySuggestion(aiStatusSuggestion, action);

        // Close popup and clear loading shortly (give a small delay for perceived responsiveness)
        setTimeout(() => {
          try {
            handleDismissAiStatusSuggestion();
          } finally {
            setAiStatusLoading(false);
          }
        }, 400);

        // Handle backend errors asynchronously and notify user if needed
        promise?.catch((error) => {
          toast({
            title: "Could not update task",
            description: error instanceof Error ? error.message : "The AI suggestion could not be applied.",
            variant: "error",
          });
        });
      } catch (error) {
        // In case applySuggestion throws synchronously (should be rare), show error and clear loading
        toast({
          title: "Could not update task",
          description: error instanceof Error ? error.message : "The AI suggestion could not be applied.",
          variant: "error",
        });
        setAiStatusLoading(false);
      }
    },
    [aiStatusSuggestion, applySuggestion, handleDismissAiStatusSuggestion, toast]
  );

  if (loading && tasks.length === 0) {
    return <DashboardSkeleton />;
  }

  if (error && tasks.length === 0) {
    return <DashboardErrorCard message={error} onRetry={() => void handleRefetch()} />;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="hidden-scrollbar space-y-6 px-4 py-6 md:px-8 md:py-8"
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
            Project: <span className="text-white">{projectName}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-5">
            <p className="text-sm text-white/55">Total Tasks</p>
            <p className="mt-2 text-3xl font-semibold text-white">{tasks.length}</p>
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

      <div className="space-y-6">
        {/* Section 1: Toolbar */}
        <TaskToolbar
          search={search}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onPriorityFilterChange={setPriorityFilter}
          onCreateTask={() => setIsCreateTaskOpen(true)}
        />

        {!hasProjectContext ? (
          <TaskEmptyState
            title="No active project selected"
            description="Select or create a project before creating tasks."
            detail="Tasks, coordination insights, and AI explanations will appear here once a project exists."
          />
        ) : filteredTasks.length === 0 ? (
          <TaskEmptyState
            title={hasActiveFilters ? "No matching tasks" : "No tasks yet"}
            description={
              hasActiveFilters
                ? "Adjust the current search or filters to see more live tasks."
                : "Create the first task for this project and the AI coordination layer will start tracking dependencies."
            }
            detail={
              hasActiveFilters
                ? "The task cache is still preserved; only the current view is filtered."
                : "Task tables, coordination insights, and AI explanations will appear here once live data is available."
            }
          />
        ) : (
          <>
            {/* Section 2: Task Table (Primary Management) */}
            <div>
              <TaskTable
                tasks={filteredTasks}
                onSelectTask={(task) => {
                  setSelectedTaskId(task.id);
                  recordInteraction(task.id);
                }}
                onUpdateStatus={handleUpdateStatus}
                onUpdatePriority={handleUpdatePriority}
              />
            </div>

            <CoordinationInsights tasks={filteredTasks} />
            {showSyncing ? (
              <Card className="border-white/10 bg-white/[0.03]">
                <CardContent className="p-4 text-sm text-white/55">Syncing live task changes...</CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>

      <TaskCreateModal
        open={isCreateTaskOpen}
        tasks={tasks}
        assignees={assignees}
        projectId={resolvedProjectId}
        projectName={projectName}
        onClose={() => setIsCreateTaskOpen(false)}
        onSubmit={handleCreate}
      />

      <TaskDetailModal
        open={Boolean(selectedTask)}
        task={selectedTask}
        assignees={assignees}
        projectName={projectName}
        onClose={() => setSelectedTaskId(null)}
        onSubmit={handleUpdateTask}
        onDelete={handleDelete}
        onSchedule={() => setIsScheduleOpen(true)}
      />

      <TaskScheduleModal
        open={isScheduleOpen}
        task={selectedTask}
        onClose={() => setIsScheduleOpen(false)}
        onSubmit={(input) => {
          if (!selectedTask) {
            return Promise.reject(new Error("No task selected"));
          }
          return scheduleTaskMutation.mutateAsync({ taskId: selectedTask.id, input });
        }}
      />

      {/* Smart Coordination Toast */}
      <SmartCoordinationToast
        suggestion={currentSuggestion}
        isOpen={isOpen}
        onDismiss={handleDismiss}
        onStartTask={handleStartTask}
        onTaskStarted={handleTaskStarted}
        isLoading={updateTaskMutation.isPending}
      />

      <AIStatusSuggestionPopup
        suggestion={aiStatusSuggestion}
        isOpen={showAiStatusPopup && Boolean(aiStatusSuggestion)}
        onDismiss={handleDismissAiStatusSuggestion}
        onApply={handleApplyAiStatusSuggestion}
        isLoading={aiStatusLoading}
      />
    </motion.main>
  );
}

export { TasksPage };
