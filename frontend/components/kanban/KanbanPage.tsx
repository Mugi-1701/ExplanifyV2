"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { motion } from "framer-motion";

import { DashboardErrorCard } from "@/components/dashboard/dashboard-error-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { queryDefaults, queryKeys } from "@/lib/query-client";
import { useProjectDisplayName } from "@/hooks/use-project-display-name";
import { useProjects } from "@/hooks/use-projects";
import { getApiErrorMessage } from "@/lib/api-errors";
import { PERMISSIONS, hasPermission } from "@/lib/rbac";
import { useRole } from "@/hooks/useRole";
import { getTaskStatusForKanbanColumn, type KanbanColumnId } from "@/services/kanban.service";
import { useKanban } from "@/hooks/useKanban";
import { getKanbanInsights } from "@/services/kanban-ai.service";
import { KanbanAiInsights } from "./KanbanAiInsights";
import { KanbanBoard } from "./KanbanBoard";

type KanbanPageProps = {
  projectId?: string;
};

type KanbanCreateValues = {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  assigneeId: string;
  dueDate: string;
  estimateHours: string;
};

const INITIAL_CREATE_VALUES: KanbanCreateValues = {
  title: "",
  description: "",
  priority: "MEDIUM",
  assigneeId: "",
  dueDate: "",
  estimateHours: "",
};

function KanbanBoardSkeleton() {
  return (
    <div className="hidden-scrollbar h-full min-h-0 overflow-x-auto pb-2">
      <div className="grid h-full min-w-[1120px] gap-4 lg:min-w-0 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"
          >
            <div className="border-b border-white/10 px-4 py-4">
              <div className="h-4 w-28 rounded-full bg-white/10" />
              <div className="mt-2 h-3 w-36 rounded-full bg-white/5" />
            </div>
            <div className="flex-1 space-y-3 p-3">
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <div key={cardIndex} className="h-28 rounded-3xl border border-white/10 bg-white/[0.03]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanPage({ projectId }: KanbanPageProps) {
  const role = useRole();
  const { projects, activeProjectId, selectedProject, loading: projectsLoading, selectProject } = useProjects();
  const projectNameFromRoute = useProjectDisplayName(projectId);
  const {
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
    isMovingTask,
    isCreatingTask,
    moveTaskToColumn,
    createBoardTask,
  } = useKanban(projectId);

  const kanbanInsightsQuery = useQuery({
    queryKey: queryKeys.aiKanbanInsights(projectId),
    queryFn: () => getKanbanInsights(projectId ?? ""),
    enabled: Boolean(projectId),
    staleTime: queryDefaults.staleTime,
    gcTime: queryDefaults.gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createValues, setCreateValues] = useState<KanbanCreateValues>(INITIAL_CREATE_VALUES);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || projectsLoading) {
      return;
    }

    const projectExists = projects.some((project) => project.id === projectId);

    if (projectExists && activeProjectId !== projectId) {
      selectProject(projectId);
    }
  }, [activeProjectId, projectId, projects, projectsLoading, selectProject]);

  const currentProject = selectedProject?.id === projectId ? selectedProject : null;
  const projectLabel = currentProject?.name ?? projectNameFromRoute ?? "Kanban board";
  const kanbanInsights = kanbanInsightsQuery.data ?? null;
  const kanbanInsightsErrorMessage = kanbanInsightsQuery.error ? getApiErrorMessage(kanbanInsightsQuery.error, "Unable to load AI insights.") : null;
  const trimmedSearch = search.trim();
  const isSearching = trimmedSearch.length > 0;
  const assignees =
    currentProject?.members?.map((member) => ({
      id: member.userId,
      name: member.user?.name ?? "Unknown member",
      email: member.user?.email ?? "",
    })) ?? [];

  const canCreate = canCreateTask && hasPermission(role, PERMISSIONS.CREATE_TASK);
  const canMove = canUpdateTask && hasPermission(role, PERMISSIONS.UPDATE_TASK);
  const isBusy = isMovingTask || isCreatingTask;

  function openCreateDialog() {
    setCreateValues(INITIAL_CREATE_VALUES);
    setCreateError(null);
    setCreateOpen(true);
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setCreateValues(INITIAL_CREATE_VALUES);
    setCreateError(null);
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId || !createValues.title.trim()) {
      return;
    }

    setCreateError(null);

    try {
      await createBoardTask({
        projectId,
        title: createValues.title.trim(),
        description: createValues.description.trim() || undefined,
        priority: createValues.priority,
        assigneeId: createValues.assigneeId || undefined,
        dueDate: createValues.dueDate || undefined,
        estimateHours: createValues.estimateHours ? Number(createValues.estimateHours) : undefined,
      });

      closeCreateDialog();
    } catch (createTaskError) {
      setCreateError(getApiErrorMessage(createTaskError, "Unable to create task."));
    }
  }

  function handleTaskDragStart(taskId: string) {
    if (!canMove) {
      return;
    }

    setDraggingTaskId(taskId);
  }

  function handleTaskDragEnd() {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  }

  async function handleTaskDrop(taskId: string, targetColumn: KanbanColumnId) {
    if (!canMove) {
      return;
    }

    const task = tasks.find((item) => item.id === taskId);

    setDraggingTaskId(null);
    setDragOverColumn(null);

    if (!task) {
      return;
    }

    const nextStatus = getTaskStatusForKanbanColumn(targetColumn);

    try {
      await moveTaskToColumn(task, nextStatus);
    } catch {
      // Centralized mutation handling keeps the board state consistent.
    }
  }

  function handleColumnDragEnter(columnId: KanbanColumnId) {
    if (canMove) {
      setDragOverColumn(columnId);
    }
  }

  function handleColumnDragLeave(columnId: KanbanColumnId, event: React.DragEvent<HTMLElement>) {
    if (!canMove) {
      return;
    }

    const relatedTarget = event.relatedTarget as Node | null;

    if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
      return;
    }

    setDragOverColumn((current) => (current === columnId ? null : current));
  }

  if (loading && tasks.length === 0) {
    return (
      <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="hidden-scrollbar flex min-h-[calc(100vh-80px)] flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
        <KanbanBoardSkeleton />
      </motion.main>
    );
  }

  if (error && tasks.length === 0) {
    return <DashboardErrorCard message={error} onRetry={() => void refetch()} />;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="hidden-scrollbar flex min-h-[calc(100vh-80px)] flex-col gap-6 px-4 py-6 md:px-8 md:py-8"
    >
      <section className="space-y-3">
        <p className="text-sm uppercase tracking-[0.22em] text-violet-200/80">Project Workflow</p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Kanban Board</h1>
            <p className="max-w-2xl text-sm leading-7 text-white/65 md:text-base">Manage project workflow visually.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
              Project: <span className="text-white">{projectLabel}</span>
            </div>
            {canCreate ? null : <Badge variant="muted" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/55">Read only</Badge>}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_70px_-36px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative w-full lg:flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks or assignees"
              className="h-12 w-full rounded-2xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/35"
            />
          </label>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-nowrap lg:items-center">
            <Select
              dropdownId="kanban-priority-filter"
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value as typeof priorityFilter)}
              options={[
                { value: "ALL", label: "All" },
                { value: "HIGH", label: "High Priority" },
                { value: "MEDIUM", label: "Medium Priority" },
                { value: "LOW", label: "Low Priority" },
                { value: "ASSIGNED_TO_ME", label: "Assigned To Me" },
              ]}
              className="w-full sm:w-[280px] lg:w-[220px]"
            />

            <Button
              type="button"
              onClick={openCreateDialog}
              disabled={!canCreate}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto lg:w-auto"
            >
              <Plus className="mr-2 size-4" />
              Add Task
            </Button>
          </div>
        </div>
      </section>

      <div className="mt-0 mb-0 flex flex-col gap-2 text-xs text-white/45 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
          {isSearching ? `Showing ${filteredTasks.length} matching tasks` : `Showing ${filteredTasks.length} tasks`}
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">{canMove ? "Drag enabled" : "Drag disabled"}</span>
        {isBusy ? <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/60">Syncing changes...</span> : null}
      </div>

      <motion.div layout className="flex flex-col gap-6">
        <motion.div
          layout
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={isSearching ? "order-first" : "order-last"}
        >
          <section className="flex-1 min-h-0">
            <KanbanBoard
              search={trimmedSearch}
              groupedTasks={groupedTasks}
              draggingTaskId={draggingTaskId}
              dragOverColumn={dragOverColumn}
              columnHealth={kanbanInsights?.columnHealth}
              canMoveTask={canMove}
              canCreateTask={canCreate}
              onCreateTask={openCreateDialog}
              onTaskDragStart={(task) => handleTaskDragStart(task.id)}
              onTaskDragEnd={handleTaskDragEnd}
              onTaskDrop={handleTaskDrop}
              onColumnDragEnter={handleColumnDragEnter}
              onColumnDragLeave={handleColumnDragLeave}
              onClearSearch={() => setSearch("")}
            />
          </section>
        </motion.div>

        <motion.div layout transition={{ duration: 0.28, ease: "easeOut" }} className={isSearching ? "order-last" : "order-first"}>
          <KanbanAiInsights
            projectName={projectLabel}
            insights={kanbanInsights}
            isLoading={kanbanInsightsQuery.isLoading}
            isError={kanbanInsightsQuery.isError}
            errorMessage={kanbanInsightsErrorMessage}
            onRetry={() => void kanbanInsightsQuery.refetch()}
          />
        </motion.div>
      </motion.div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (open) {
            openCreateDialog();
          } else {
            closeCreateDialog();
          }
        }}
        title="Create task"
        description={`Add a new task to ${projectLabel}.`}
        size="lg"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={closeCreateDialog} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button type="submit" form="kanban-create-task-form" disabled={!canCreate || isBusy || !createValues.title.trim()} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50">
              {isCreatingTask ? "Creating..." : "Create Task"}
            </Button>
          </div>
        }
      >
        <form id="kanban-create-task-form" className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateTask}>
          <Input
            value={createValues.title}
            onChange={(event) => setCreateValues((current) => ({ ...current, title: event.target.value }))}
            placeholder="Task title"
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30 md:col-span-2"
          />

          <textarea
            value={createValues.description}
            onChange={(event) => setCreateValues((current) => ({ ...current, description: event.target.value }))}
            placeholder="Task description"
            className="min-h-28 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 md:col-span-2"
          />

          <label className="space-y-2 text-sm text-white/65">
            <span className="text-xs uppercase tracking-[0.18em] text-white/45">Assignee</span>
            <Select
              dropdownId="kanban-create-assignee"
              value={createValues.assigneeId}
              onChange={(value) => setCreateValues((current) => ({ ...current, assigneeId: value }))}
              placeholder="Unassigned"
              options={[
                { value: "", label: "Unassigned" },
                ...assignees.map((assignee) => ({
                  value: assignee.id,
                  label: `${assignee.name}${assignee.email ? ` (${assignee.email})` : ""}`,
                })),
              ]}
            />
          </label>

          <label className="space-y-2 text-sm text-white/65">
            <span className="text-xs uppercase tracking-[0.18em] text-white/45">Deadline</span>
            <input
              type="date"
              value={createValues.dueDate}
              onChange={(event) => setCreateValues((current) => ({ ...current, dueDate: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
            />
          </label>

          <label className="space-y-2 text-sm text-white/65">
            <span className="text-xs uppercase tracking-[0.18em] text-white/45">Priority</span>
            <Select
              dropdownId="kanban-create-priority"
              value={createValues.priority}
              onChange={(value) =>
                setCreateValues((current) => ({
                  ...current,
                  priority: value as KanbanCreateValues["priority"],
                }))
              }
              options={[
                { value: "LOW", label: "LOW" },
                { value: "MEDIUM", label: "MEDIUM" },
                { value: "HIGH", label: "HIGH" },
                { value: "CRITICAL", label: "CRITICAL" },
              ]}
            />
          </label>

          <label className="space-y-2 text-sm text-white/65">
            <span className="text-xs uppercase tracking-[0.18em] text-white/45">Estimate Hours</span>
            <Input
              type="number"
              min={1}
              step={1}
              value={createValues.estimateHours}
              onChange={(event) => setCreateValues((current) => ({ ...current, estimateHours: event.target.value }))}
              placeholder="Hours"
              className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
            />
          </label>

          {createError ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">{createError}</div>
          ) : null}
        </form>
      </Dialog>
    </motion.main>
  );
}

export { KanbanPage };
