"use client";

import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TaskToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateTask: () => void;
};

function TaskToolbar({ search, onSearchChange, onCreateTask }: TaskToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Tasks</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Live project task board</h2>
      </div>

      <div className="flex flex-1 flex-col gap-3 md:max-w-2xl md:flex-row md:items-center md:justify-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search tasks, blockers, coordination..."
            className="h-12 rounded-2xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/30"
          />
        </div>
        <Button onClick={onCreateTask} className="h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95">
          <Plus className="mr-2 size-4" />
          New task
        </Button>
      </div>
    </div>
  );
}

export { TaskToolbar };