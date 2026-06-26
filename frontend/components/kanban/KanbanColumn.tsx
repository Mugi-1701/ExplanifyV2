"use client";

import type React from "react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Task } from "@/types/task";
import type { KanbanInsightColumnHealth } from "@/types/kanban-ai";
import { KanbanTaskCard } from "./KanbanTaskCard";
import type { KanbanColumnDefinition, KanbanColumnId } from "@/services/kanban.service";

type KanbanColumnProps = {
  column: KanbanColumnDefinition;
  tasks: Task[];
  draggingTaskId: string | null;
  isDragOver: boolean;
  health: KanbanInsightColumnHealth | null;
  canMoveTask: boolean;
  canCreateTask: boolean;
  onCreateTask: () => void;
  onTaskDragStart: (task: Task) => void;
  onTaskDragEnd: () => void;
  onTaskDrop: (taskId: string, targetColumn: KanbanColumnId) => void;
  onColumnDragEnter: (columnId: KanbanColumnId) => void;
  onColumnDragLeave: (columnId: KanbanColumnId, event: React.DragEvent<HTMLElement>) => void;
};

function KanbanColumn({
  column,
  tasks,
  draggingTaskId,
  isDragOver,
  health,
  canMoveTask,
  canCreateTask,
  onCreateTask,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop,
  onColumnDragEnter,
  onColumnDragLeave,
}: KanbanColumnProps) {
  const accentStyles: Record<KanbanColumnDefinition["tone"], string> = {
    violet: "border-violet-400/20 bg-violet-500/10 text-violet-100",
    blue: "border-blue-400/20 bg-blue-500/10 text-blue-100",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  };

  const healthStyles: Record<NonNullable<KanbanInsightColumnHealth["tone"]>, string> = {
    good: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    neutral: "border-white/10 bg-white/5 text-white/65",
    warn: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    critical: "border-rose-400/20 bg-rose-500/10 text-rose-100",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex h-full min-h-0 w-[320px] max-w-[360px] flex-shrink-0 flex-col overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,rgba(10,14,24,0.95),rgba(6,10,18,0.94))] shadow-[0_25px_70px_-35px_rgba(0,0,0,0.9)] sm:w-[340px] md:w-[360px] lg:w-[340px] xl:w-auto xl:max-w-none xl:flex-1",
        isDragOver ? "border-violet-400/35 ring-1 ring-violet-400/20" : "border-white/10"
      )}
      onDragEnter={() => {
        if (canMoveTask) {
          onColumnDragEnter(column.id);
        }
      }}
      onDragLeave={(event) => {
        if (canMoveTask) {
          onColumnDragLeave(column.id, event);
        }
      }}
      onDragOver={(event) => {
        if (canMoveTask) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      }}
      onDrop={(event) => {
        if (!canMoveTask) {
          return;
        }

        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/plain") || draggingTaskId;

        if (taskId) {
          onTaskDrop(taskId, column.id);
        }
      }}
    >
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[rgba(8,12,22,0.96)] px-4 py-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", column.tone === "violet" && "bg-violet-300", column.tone === "blue" && "bg-blue-300", column.tone === "amber" && "bg-amber-300", column.tone === "emerald" && "bg-emerald-300")} />
              <h2 className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-white/85">{column.label}</h2>
            </div>
            <p className="mt-1 text-xs text-white/40">Sticky header, scrollable column</p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Badge variant="muted" className={cn("rounded-full border px-3 py-1 text-xs font-medium", accentStyles[column.tone])}>
              {tasks.length}
            </Badge>
            {health ? (
              <Badge
                variant="muted"
                title={health.reason}
                className={cn("rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.08em]", healthStyles[health.tone])}
              >
                {health.label}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <CardContent className="hidden-scrollbar flex-1 min-h-0 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
            <p className="text-sm font-medium text-white">No Tasks</p>
            <p className="mt-2 text-sm text-white/50">Drag tasks here</p>
            {canCreateTask ? (
              <>
                <p className="mt-1 text-sm text-white/50">or</p>
                <button
                  type="button"
                  onClick={onCreateTask}
                  className="mt-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-100 transition hover:bg-violet-500/15"
                >
                  Create a new task
                </button>
              </>
            ) : (
              <p className="mt-2 text-sm text-white/45">Create access required to add a task here.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                draggable={canMoveTask}
                isDragging={draggingTaskId === task.id}
                onDragStart={onTaskDragStart}
                onDragEnd={onTaskDragEnd}
              />
            ))}
          </div>
        )}
      </CardContent>
    </motion.section>
  );
}

export { KanbanColumn };
