"use client";

import type React from "react";
import { GripVertical } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getPriorityTone } from "@/components/tasks/task-utils";
import type { Task } from "@/types/task";

type KanbanTaskCardProps = {
  task: Task;
  search: string;
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: (task: Task, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
};

function formatDueDate(dueDate?: string | null) {
  if (!dueDate) {
    return "No due date";
  }

  const date = new Date(dueDate);

  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTaskAge(task: Task) {
  if (task.status === "DONE" || task.status === "CANCELED" || task.status === "ARCHIVED") {
    return null;
  }

  const source = task.updatedAt ?? task.createdAt;
  if (!source) {
    return null;
  }

  const timestamp = new Date(source).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const ageDays = Math.floor((Date.now() - timestamp) / 86_400_000);
  if (ageDays <= 0) {
    return null;
  }

  const labelByStatus: Record<string, string> = {
    TODO: "Waiting",
    IN_PROGRESS: "Active",
    IN_REVIEW: "Review",
    BLOCKED: "Blocked",
  };

  return `${labelByStatus[task.status] ?? "Aging"} ${ageDays}d`;
}

function highlightMatch(text: string, search: string) {
  const query = search.trim();

  if (!query) {
    return text;
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) {
    return text;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + query.length);
  const after = text.slice(matchIndex + query.length);

  return (
    <>
      {before}
      <mark className="rounded bg-violet-400/20 px-0.5 text-inherit">{match}</mark>
      {after}
    </>
  );
}

function KanbanTaskCard({ task, search, draggable = true, isDragging = false, onDragStart, onDragEnd }: KanbanTaskCardProps) {
  const ageLabel = formatTaskAge(task);

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 240, damping: 20 }}>
      <Card
        className={cn(
          "group border-white/10 bg-[linear-gradient(180deg,rgba(13,20,37,0.98),rgba(9,15,28,0.95))] shadow-[0_20px_45px_-28px_rgba(0,0,0,0.8)] transition",
          isDragging && "scale-[0.985] border-violet-400/30 bg-violet-500/10 opacity-60 shadow-[0_0_0_1px_rgba(168,85,247,0.2)]"
        )}
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-6 text-white transition group-hover:text-violet-100">
                {highlightMatch(task.title, search)}
              </p>
            </div>

            <button
              type="button"
              draggable={draggable}
              onDragStart={(event) => {
                if (!draggable) {
                  event.preventDefault();
                  return;
                }

                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", task.id);
                onDragStart?.(task, event);
              }}
              onDragEnd={onDragEnd}
              className={cn(
                "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/35 transition",
                draggable ? "cursor-grab active:cursor-grabbing hover:bg-white/10 hover:text-white/65" : "cursor-default"
              )}
              aria-label={`Drag ${task.title}`}
            >
              <GripVertical className="size-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className={cn(getPriorityTone(task.priority), "rounded-full capitalize")}>
              {task.priority ?? "MEDIUM"}
            </Badge>
            {ageLabel ? (
              <Badge variant="muted" className="rounded-full border-white/10 bg-white/5 text-white/55">
                {ageLabel}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-1 text-sm text-white/60">
            <p className="truncate">
              <span className="text-white/40">Assignee:</span> {task.assignee?.name ?? "Unassigned"}
            </p>
            <p className="truncate">
              <span className="text-white/40">Due:</span> {formatDueDate(task.dueDate)}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export { KanbanTaskCard };
