export type ProjectOwner = {
  id: string;
  name: string;
  email: string;
};

export type ProjectOrganization = {
  id: string;
  name: string;
  slug: string;
};

export type Project = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  status?: string | null;
  orgId?: string | null;
  ownerId?: string | null;
  teamId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  owner?: ProjectOwner;
  organization?: ProjectOrganization;
};

export type ProjectStats = {
  taskCount: number;
  completedTaskCount: number;
  blockedTaskCount: number;
  activeTaskCount: number;
  coordinationHealth: "HEALTHY" | "READY" | "WARNING" | "BLOCKED" | "EMPTY";
  coordinationReason: string;
};

export type ProjectWithStats = Project & {
  isActive: boolean;
  stats: ProjectStats;
};

export type ProjectListResponse = {
  data: Project[];
};

export type CreateProjectInput = {
  orgId: string;
  name: string;
  slug?: string;
  description?: string;
  status?: string;
  teamId?: string;
  startDate?: string;
  dueDate?: string;
};

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, "orgId">>;