"use client";

import type React from "react";
import { motion } from "framer-motion";

import type { Task } from "@/types/task";
import type { KanbanInsightColumnHealth } from "@/types/kanban-ai";
import { KanbanColumn } from "./KanbanColumn";
import { KANBAN_COLUMNS, type KanbanBoardGroups, type KanbanColumnId } from "@/services/kanban.service";

type KanbanBoardProps = {
  search: string;
  groupedTasks: KanbanBoardGroups;
  draggingTaskId: string | null;
  dragOverColumn: KanbanColumnId | null;
  canMoveTask: boolean;
  canCreateTask: boolean;
  onCreateTask: () => void;
  onTaskDragStart: (task: Task) => void;
  onTaskDragEnd: () => void;
  onTaskDrop: (taskId: string, targetColumn: KanbanColumnId) => void;
  onColumnDragEnter: (columnId: KanbanColumnId) => void;
  onColumnDragLeave: (columnId: KanbanColumnId, event: React.DragEvent<HTMLElement>) => void;
  columnHealth?: Partial<Record<KanbanColumnId, KanbanInsightColumnHealth>>;
  onClearSearch: () => void;
};

function KanbanBoard({
  groupedTasks,
  draggingTaskId,
  dragOverColumn,
  canMoveTask,
  canCreateTask,
  onCreateTask,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop,
  onColumnDragEnter,
  onColumnDragLeave,
  columnHealth,
  search,
  onClearSearch,
}: KanbanBoardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="hidden-scrollbar h-full min-h-0 overflow-x-auto overflow-y-hidden pb-2"
    >
      <div className="flex h-full min-w-max gap-4 lg:grid lg:min-w-0 lg:grid-cols-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={groupedTasks[column.id]}
            search={search}
            draggingTaskId={draggingTaskId}
            isDragOver={dragOverColumn === column.id}
            health={columnHealth?.[column.id] ?? null}
            canMoveTask={canMoveTask}
            canCreateTask={canCreateTask}
            onCreateTask={onCreateTask}
            onTaskDragStart={onTaskDragStart}
            onTaskDragEnd={onTaskDragEnd}
            onTaskDrop={onTaskDrop}
            onColumnDragEnter={onColumnDragEnter}
            onColumnDragLeave={onColumnDragLeave}
            onClearSearch={onClearSearch}
          />
        ))}
      </div>
    </motion.div>
  );
}

export { KanbanBoard };
