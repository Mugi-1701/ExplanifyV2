"use client";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CreateTaskInput, Task } from "@/types/task";

type TaskToolbarProps = {
  search: string;
  statusFilter: "ALL" | Task["status"];
  priorityFilter: "ALL" | NonNullable<CreateTaskInput["priority"]>;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: "ALL" | Task["status"]) => void;
  onPriorityFilterChange: (value: "ALL" | NonNullable<CreateTaskInput["priority"]>) => void;
  onCreateTask: () => void;
};

function TaskToolbar({
  search,
  statusFilter,
  priorityFilter,
  onSearchChange,
  onStatusFilterChange,
  onPriorityFilterChange,
  onCreateTask,
}: TaskToolbarProps) {
  const statusOptions = [
    { value: "ALL", label: "All status" },
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "BLOCKED", label: "Blocked" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "DONE", label: "Done" },
    { value: "CANCELED", label: "Canceled" },
  ];

  const priorityOptions = [
    { value: "ALL", label: "All priority" },
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "CRITICAL", label: "Critical" },
  ];

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl md:space-y-0">
      <div className="md:hidden">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Tasks</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Live project task board</h2>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
        <div className="relative md:flex-[0.68] lg:flex-[0.72] xl:flex-[0.75]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks, blockers, coordination..."
            className="h-14 rounded-2xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/30"
          />
        </div>

        <div className="flex items-stretch gap-3 md:flex-[0.32] md:justify-end lg:flex-[0.28] xl:flex-[0.25]">
          <div className="flex-1 md:flex-none md:min-w-40">
            <Select
              dropdownId="task-status-filter"
              value={statusFilter}
              onChange={(value) => onStatusFilterChange(value as "ALL" | Task["status"])}
              options={statusOptions}
              placeholder="Status"
              className="w-full"
            />
          </div>

          <div className="flex-1 md:flex-none md:min-w-40">
            <Select
              dropdownId="task-priority-filter"
              value={priorityFilter}
              onChange={(value) => onPriorityFilterChange(value as "ALL" | NonNullable<CreateTaskInput["priority"]>)}
              options={priorityOptions}
              placeholder="Priority"
              className="w-full"
            />
          </div>

          <Button
            onClick={onCreateTask}
            className="h-14 shrink-0 whitespace-nowrap rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 md:ml-auto"
          >
            <Plus className="mr-2 size-4" />
            Create Task
          </Button>
        </div>
      </div>
    </div>
  );
}

export { TaskToolbar };
