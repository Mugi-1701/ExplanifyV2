import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithStats } from "@/types/project";

type ProjectStatsProps = {
  projects: ProjectWithStats[];
};

function ProjectStats({ projects }: ProjectStatsProps) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const activeProject = safeProjects.find((project) => project.isActive) ?? safeProjects[0] ?? null;
  const totalProjects = safeProjects.length;
  const totalTasks = safeProjects.reduce((sum, project) => sum + (project.stats?.taskCount ?? 0), 0);
  const blockedTasks = safeProjects.reduce((sum, project) => sum + (project.stats?.blockedTaskCount ?? 0), 0);
  const completedTasks = safeProjects.reduce((sum, project) => sum + (project.stats?.completedTaskCount ?? 0), 0);

  const stats = [
    { label: "Total Projects", value: String(totalProjects), tone: "violet" },
    { label: "Total Tasks", value: String(totalTasks), tone: "blue" },
    { label: "Completed Tasks", value: String(completedTasks), tone: "emerald" },
    { label: "Blocked Tasks", value: String(blockedTasks), tone: "amber" },
  ] as const;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-5">
            <p className="text-sm text-white/55">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
          </CardContent>
        </Card>
      ))}

      <Card className="border-white/10 bg-white/[0.03] md:col-span-2 xl:col-span-4">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-white/55">Active project</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {activeProject?.name ?? "No active project selected"}
            </p>
            <p className="mt-1 text-sm text-white/50">
              {activeProject?.stats?.coordinationReason ?? "Select a project to sync the dashboard and tasks views."}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
            {activeProject ? `${activeProject.stats?.taskCount ?? 0} live tasks` : "Awaiting selection"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { ProjectStats };
