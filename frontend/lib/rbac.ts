import { getActiveOrgRoleFromAccessToken } from "@/lib/token";

export const ORGANIZATION_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[keyof typeof ORGANIZATION_ROLES];

export const PERMISSIONS = {
  CREATE_PROJECT: "CREATE_PROJECT",
  UPDATE_PROJECT: "UPDATE_PROJECT",
  DELETE_PROJECT: "DELETE_PROJECT",
  DELETE_ORGANIZATION: "DELETE_ORGANIZATION",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
  CREATE_TASK: "CREATE_TASK",
  UPDATE_TASK: "UPDATE_TASK",
  DELETE_TASK: "DELETE_TASK",
  ASSIGN_TASK: "ASSIGN_TASK",
  VIEW_PROJECT: "VIEW_PROJECT",
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  VIEW_ACTIVITY: "VIEW_ACTIVITY",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<OrganizationRole, readonly Permission[]> = {
  OWNER: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.DELETE_ORGANIZATION,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.UPDATE_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ACTIVITY,
  ],
  ADMIN: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.UPDATE_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ACTIVITY,
  ],
  MEMBER: [
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ACTIVITY,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.UPDATE_TASK,
    PERMISSIONS.ASSIGN_TASK,
  ],
  VIEWER: [PERMISSIONS.VIEW_PROJECT, PERMISSIONS.VIEW_DASHBOARD, PERMISSIONS.VIEW_ACTIVITY],
};

export function hasPermission(role: OrganizationRole | null | undefined, permission: Permission): boolean {
  if (!role) {
    return false;
  }

  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getOrgRole(role: string | null | undefined): OrganizationRole | null {
  if (!role) {
    return null;
  }

  return role in ORGANIZATION_ROLES ? (role as OrganizationRole) : null;
}

export function getActiveOrganizationRole(): OrganizationRole | null {
  return getOrgRole(getActiveOrgRoleFromAccessToken());
}

export function canShowCreateProject(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.CREATE_PROJECT);
}

export function canShowDeleteProject(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.DELETE_PROJECT);
}

export function canShowUpdateProject(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.UPDATE_PROJECT);
}

export function canShowDeleteTask(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.DELETE_TASK);
}

export function canShowManageMembers(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.MANAGE_MEMBERS);
}

export function canShowCreateTask(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.CREATE_TASK);
}

export function canShowDeleteOrganization(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.DELETE_ORGANIZATION);
}

export function canViewDashboard(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.VIEW_DASHBOARD);
}

export function canViewActivity(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.VIEW_ACTIVITY);
}
