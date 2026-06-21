import { api } from "@/lib/api";
import { ACTIVE_PROJECT_KEY, readStoredValue, removeStoredValue, writeStoredValue } from "@/lib/storage";
import type { AddProjectMemberInput, CreateProjectInput, Project, ProjectMember, UpdateProjectInput } from "@/types/project";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVE_PROJECT_CHANGED_EVENT = "explanify:active-project-changed";

function unwrapProjectResponse(responseData: unknown) {
  if (Array.isArray(responseData)) {
    return responseData as Project[];
  }

  if (responseData && typeof responseData === "object" && "data" in responseData) {
    const data = (responseData as { data?: Project | Project[] }).data;
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  return [] as Project[];
}

function getActiveProjectId() {
  return readStoredValue(ACTIVE_PROJECT_KEY) ?? undefined;
}

function emitActiveProjectChanged(projectId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(ACTIVE_PROJECT_CHANGED_EVENT, {
      detail: {
        projectId,
      },
    })
  );
}

function setActiveProjectId(projectId: string) {
  writeStoredValue(ACTIVE_PROJECT_KEY, projectId);
  emitActiveProjectChanged(projectId);
}

function clearActiveProjectId() {
  removeStoredValue(ACTIVE_PROJECT_KEY);
  emitActiveProjectChanged(null);
}

async function getProjects(): Promise<Project[]> {
  const { data } = await api.get("/projects");
  return unwrapProjectResponse(data);
}

async function getProjectById(projectId: string): Promise<Project> {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const { data } = await api.get(`/projects/${projectId}`);
  const [project] = unwrapProjectResponse(data);

  if (!project) {
    throw new Error("Project not found");
  }

  return project;
}

async function createProject(input: CreateProjectInput): Promise<Project> {
  const orgId = input.orgId?.trim();

  if (!orgId) {
    throw new Error("orgId is required");
  }

  const payload: CreateProjectInput = {
    ...input,
    orgId,
  };

  const { data } = await api.post("/projects", payload);
  const [project] = unwrapProjectResponse(data);

  if (!project) {
    throw new Error("Failed to create project");
  }

  return project;
}

async function updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  const { data } = await api.patch(`/projects/${projectId}`, input);
  const [project] = unwrapProjectResponse(data);

  if (!project) {
    throw new Error("Failed to update project");
  }

  return project;
}

async function deleteProject(projectId: string): Promise<void> {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  await api.delete(`/projects/${projectId}`);
}

async function getProjectMembers(projectId: string) {
  const { data } = await api.get(`/projects/${projectId}/members`);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object" && "data" in data) {
    return (data as { data?: unknown[] }).data ?? [];
  }
  return [];
}

async function addProjectMember(projectId: string, input: AddProjectMemberInput) {
  const { data } = await api.post(`/projects/${projectId}/members`, input);
  return data;
}

async function updateProjectMember(projectId: string, userId: string, input: Partial<Pick<ProjectMember, "role" | "skills">>) {
  const { data } = await api.patch(`/projects/${projectId}/members/${userId}`, input);
  return data;
}

async function removeProjectMember(projectId: string, userId: string) {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

export {
  ACTIVE_PROJECT_CHANGED_EVENT,
  clearActiveProjectId,
  createProject,
  deleteProject,
  addProjectMember,
  getActiveProjectId,
  getProjectById,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  setActiveProjectId,
  updateProjectMember,
  updateProject,
};
