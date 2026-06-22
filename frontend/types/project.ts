export type ProjectOwner = {
  id: string;
  name: string;
  email: string;
};

export type ProjectMemberUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  roleId?: string | null;
  role?: string;
  createdAt?: string;
  user?: ProjectMemberUser;
  skillIds?: string[];
  skills?: string[];
  memberSkills?: Array<{
    skillId?: string;
    skill?: {
      id?: string;
      name?: string | null;
    } | null;
    name?: string | null;
  }>;
  assignedTaskCount?: number;
  completedTaskCount?: number;
  activeTaskCount?: number;
};

export type ProjectTask = {
  id: string;
  status: string;
  assigneeId?: string | null;
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
  members?: ProjectMember[];
  tasks?: ProjectTask[];
  progressPercentage?: number;
  stats?: ProjectStats;
};

export type ProjectStats = {
  taskCount: number;
  completedTaskCount: number;
  blockedTaskCount: number;
  activeTaskCount: number;
  progressPercentage: number;
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
  category?: string;
  priority?: string;
  goal?: string;
  expectedDeliverable?: string;
  estimatedDuration?: string;
  leadId?: string;
};

export type UpdateProjectInput = Partial<Omit<CreateProjectInput, "orgId">>;

export type AddProjectMemberInput = {
  userId: string;
  roleId?: string | null;
  role?: string;
  skillIds?: string[];
};
