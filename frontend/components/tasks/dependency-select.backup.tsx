"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, X } from "lucide-react";

type TaskOption = {
  id: string;
  title: string;
  status: string;
};

type DependencySelectProps = {
  value: string | null;
  onChange: (taskId: string | null) => void;
  projectId: string;
  excludeTaskId?: string;
};

function DependencySelect({
  value,
  onChange,
  projectId,
  excludeTaskId,
}: DependencySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDependency, setSelectedDependency] = useState<TaskOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: availableTasks = [], isLoading } = useQuery({
    queryKey: ["available-tasks", projectId, excludeTaskId],
    queryFn: async () => {
      const params = new URLSearchParams({
        projectId,
        ...(excludeTaskId && { excludeTaskId }),
      });
      const response = await fetch(
        `/api/tasks/available-for-dependency?${params}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json() as Promise<TaskOption[]>;
    },
    enabled: !!projectId,
  });

  // Sync selectedDependency with value from parent
  useEffect(() => {
    if (value) {
      const task = availableTasks.find((t) => t.id === value);
      if (task) {
        setSelectedDependency(task);
      }
    } else {
      setSelectedDependency(null);
    }
  }, [value, availableTasks]);

  // Filter tasks based on search input only
  const filteredTasks = availableTasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelectTask = (task: TaskOption) => {
    setSelectedDependency(task);
    onChange(task.id);
    setIsOpen(false);
    setSearch("");
  };

  const handleClearDependency = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDependency(null);
    onChange(null);
    setSearch("");
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-xs uppercase tracking-[0.18em] text-white/55">
        Depends On (optional)
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group w-full h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-white placeholder:text-white/30 transition hover:bg-white/10 hover:border-white/20 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/15"
      >
        <div className="flex items-center justify-between gap-2">
          <span className={selectedDependency ? "text-white" : "text-white/50"}>
            {selectedDependency ? selectedDependency.title : "Select a task to depend on..."}
          </span>
          <ChevronDown
            className={`size-4 text-white/40 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="animate-in fade-in duration-150 rounded-2xl border border-purple-500/20 bg-[#1b1d31]/95 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.12)] overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-white/10">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/30 focus:border-violet-400/40 focus:outline-none focus:ring-2 focus:ring-violet-500/15 transition"
            />
          </div>

          {/* Task List */}
          <div className="max-h-56 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center px-4 py-6">
                <div className="text-sm text-white/50">Loading tasks...</div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex items-center justify-center px-4 py-6">
                <div className="text-sm text-white/50">
                  {availableTasks.length === 0
                    ? "No available tasks"
                    : "No matching tasks"}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectTask(task);
                    }}
                    className={`w-full px-4 py-3 text-left transition-all duration-200 cursor-pointer ${
                      value === task.id
                        ? "bg-purple-500/15 border-l-2 border-purple-400 text-white"
                        : "text-white/70 hover:bg-purple-500/10 active:bg-purple-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 pointer-events-none">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-xs text-white/40 mt-0.5">{task.status}</p>
                      </div>
                      {value === task.id && (
                        <div className="size-2 rounded-full bg-purple-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Button */}
          {value && (
            <div className="border-t border-white/10 px-3 py-2">
              <button
                type="button"
                onClick={handleClearDependency}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
              >
                <X className="size-4" />
                Clear dependency
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected Dependency Preview */}
      {value && selectedDependency && (
        <div className="animate-in fade-in duration-150 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-sm">
          <p className="text-white/60">
            🧩 Depends on:{" "}
            <span className="text-white font-medium">{selectedDependency.title}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export { DependencySelect };
