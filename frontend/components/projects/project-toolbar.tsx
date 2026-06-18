"use client";

import { LayoutGrid, List, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectStats } from "@/types/project";

type ProjectToolbarProps = {
  search: string;
  viewMode: "grid" | "list";
  statusFilter: string;
  healthFilter: "ALL" | ProjectStats["coordinationHealth"];
  onSearchChange: (value: string) => void;
  onViewModeChange: (viewMode: "grid" | "list") => void;
  onStatusFilterChange: (value: string) => void;
  onHealthFilterChange: (value: "ALL" | ProjectStats["coordinationHealth"]) => void;
  onCreateProject: () => void;
};

function ProjectToolbar({
  search,
  viewMode,
  statusFilter,
  healthFilter,
  onSearchChange,
  onViewModeChange,
  onStatusFilterChange,
  onHealthFilterChange,
  onCreateProject,
}: ProjectToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-white/45">Projects</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Manage active workspaces</h2>
      </div>

      <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
        <div className="relative flex-1 xl:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects, descriptions, orgs..."
            className="h-12 rounded-2xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-white/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 xl:w-40"
        >
          <option value="ALL">All status</option>
          {(["PLANNING", "ACTIVE", "AT_RISK", "PAUSED", "COMPLETED", "ARCHIVED"] as const).map((status) => (
            <option key={status} value={status}>
              {status.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select
          value={healthFilter}
          onChange={(event) => onHealthFilterChange(event.target.value as "ALL" | ProjectStats["coordinationHealth"])}
          className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 xl:w-40"
        >
          <option value="ALL">All health</option>
          {(["HEALTHY", "READY", "WARNING", "BLOCKED", "EMPTY"] as const).map((health) => (
            <option key={health} value={health}>
              {health}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${viewMode === "grid" ? "bg-violet-500/15 text-violet-100" : "text-white/55 hover:text-white"}`}
            >
              <LayoutGrid className="size-4" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${viewMode === "list" ? "bg-violet-500/15 text-violet-100" : "text-white/55 hover:text-white"}`}
            >
              <List className="size-4" />
              List
            </button>
          </div>

          <Button onClick={onCreateProject} className="h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95">
            <Plus className="mr-2 size-4" />
            Create project
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ProjectToolbar };
