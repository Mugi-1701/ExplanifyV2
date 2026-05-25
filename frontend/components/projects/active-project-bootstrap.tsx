"use client";

import { useProjects } from "@/hooks/use-projects";

function ActiveProjectBootstrap() {
  useProjects();

  return null;
}

export { ActiveProjectBootstrap };
