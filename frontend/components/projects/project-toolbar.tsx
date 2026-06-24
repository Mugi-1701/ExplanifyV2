"use client";

import { LayoutGrid, List, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { canShowCreateProject } from "@/lib/rbac";
import { useRole } from "@/hooks/useRole";
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
  const role = useRole();
  const showCreateProject = canShowCreateProject(role);

  return (
    <div className="flex w-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl xl:flex-row xl:items-center xl:justify-between">
      <div className="shrink-0">
        <p className="text-sm uppercase tracking-[0.18em] text-white/45">Projects</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Manage active workspaces</h2>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
        <div className="relative w-full min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search projects, descriptions, orgs..."
            className="h-12 w-full min-w-0 rounded-2xl border-white/10 bg-white/5 pl-11 pr-4 text-white placeholder:text-white/30"
          />
        </div>
        <div className="xl:w-40">
          <Select
            dropdownId="status-selector"
            value={statusFilter}
            onChange={(v) => onStatusFilterChange(v)}
            options={[
              { value: "ALL", label: "All status" },
              { value: "PLANNING", label: "PLANNING" },
              { value: "ACTIVE", label: "ACTIVE" },
              { value: "AT_RISK", label: "AT RISK" },
              { value: "PAUSED", label: "PAUSED" },
              { value: "COMPLETED", label: "COMPLETED" },
              { value: "ARCHIVED", label: "ARCHIVED" },
            ]}
          />
        </div>
        <div className="xl:w-40">
          <Select
            dropdownId="health-selector"
            value={healthFilter}
            onChange={(v) => onHealthFilterChange(v as "ALL" | ProjectStats["coordinationHealth"]) }
            options={[
              { value: "ALL", label: "All health" },
              { value: "HEALTHY", label: "HEALTHY" },
              { value: "READY", label: "READY" },
              { value: "WARNING", label: "WARNING" },
              { value: "BLOCKED", label: "BLOCKED" },
              { value: "EMPTY", label: "EMPTY" },
            ]}
          />
        </div>

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

          {showCreateProject ? (
            <Button onClick={onCreateProject} className="h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95">
              <Plus className="mr-2 size-4" />
              Create project
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export { ProjectToolbar };
