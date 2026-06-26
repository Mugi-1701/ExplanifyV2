import type { Task, TaskStatus } from "@/types/task";

type KanbanColumnId = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type KanbanPriorityFilter = "ALL" | "HIGH" | "MEDIUM" | "LOW" | "ASSIGNED_TO_ME";

type KanbanColumnDefinition = {
  id: KanbanColumnId;
  label: string;
  tone: "violet" | "blue" | "amber" | "emerald";
};

type KanbanFilters = {
  search: string;
  priority: KanbanPriorityFilter;
  currentUserId?: string | null;
};

type KanbanBoardGroups = Record<KanbanColumnId, Task[]>;

const KANBAN_COLUMNS: KanbanColumnDefinition[] = [
  { id: "TODO", label: "To Do", tone: "violet" },
  { id: "IN_PROGRESS", label: "In Progress", tone: "blue" },
  { id: "REVIEW", label: "Review", tone: "amber" },
  { id: "DONE", label: "Done", tone: "emerald" },
];

const KANBAN_COLUMN_ORDER = KANBAN_COLUMNS.map((column) => column.id) as KanbanColumnId[];

const priorityWeight: Record<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW", number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function getKanbanColumnId(status: TaskStatus): KanbanColumnId {
  switch (status) {
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "IN_REVIEW":
      return "REVIEW";
    case "DONE":
      return "DONE";
    case "TODO":
    case "BLOCKED":
    case "CANCELED":
    case "ARCHIVED":
    default:
      return "TODO";
  }
}

function getTaskStatusForKanbanColumn(columnId: KanbanColumnId): TaskStatus {
  switch (columnId) {
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "REVIEW":
      return "IN_REVIEW";
    case "DONE":
      return "DONE";
    case "TODO":
    default:
      return "TODO";
  }
}

function getKanbanPriority(task: Task): keyof typeof priorityWeight {
  return task.priority && task.priority in priorityWeight ? (task.priority as keyof typeof priorityWeight) : "MEDIUM";
}

function sortKanbanTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    const leftPriority = priorityWeight[getKanbanPriority(left)];
    const rightPriority = priorityWeight[getKanbanPriority(right)];

    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }

    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.POSITIVE_INFINITY;

    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }

    const leftUpdatedAt = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
    const rightUpdatedAt = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;

    if (leftUpdatedAt !== rightUpdatedAt) {
      return rightUpdatedAt - leftUpdatedAt;
    }

    return left.title.localeCompare(right.title);
  });
}

function filterKanbanTasks(tasks: Task[], filters: KanbanFilters) {
  const search = filters.search.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.priority === "ASSIGNED_TO_ME" && task.assigneeId !== filters.currentUserId) {
      return false;
    }

    if (filters.priority !== "ALL" && filters.priority !== "ASSIGNED_TO_ME") {
      const taskPriority = getKanbanPriority(task);

      if (filters.priority === "HIGH") {
        if (!["HIGH", "CRITICAL"].includes(taskPriority)) {
          return false;
        }
      } else if (taskPriority !== filters.priority) {
        return false;
      }
    }

    if (!search) {
      return true;
    }

    const assigneeSearch = task.assignee ? `${task.assignee.name} ${task.assignee.email}` : "unassigned";
    const haystack = `${task.title} ${assigneeSearch}`.toLowerCase();

    return haystack.includes(search);
  });
}

function groupKanbanTasks(tasks: Task[]): KanbanBoardGroups {
  const groups: KanbanBoardGroups = {
    TODO: [],
    IN_PROGRESS: [],
    REVIEW: [],
    DONE: [],
  };

  sortKanbanTasks(tasks).forEach((task) => {
    const columnId = getKanbanColumnId(task.status);
    groups[columnId].push(task);
  });

  return groups;
}

export type { KanbanBoardGroups, KanbanColumnDefinition, KanbanColumnId, KanbanFilters, KanbanPriorityFilter };
export {
  KANBAN_COLUMNS,
  KANBAN_COLUMN_ORDER,
  filterKanbanTasks,
  getKanbanColumnId,
  getTaskStatusForKanbanColumn,
  groupKanbanTasks,
  sortKanbanTasks,
};
