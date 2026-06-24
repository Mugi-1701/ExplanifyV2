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
  DELETE_PROJECT: "DELETE_PROJECT",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
  ROLE_MANAGEMENT: "ROLE_MANAGEMENT",
  CREATE_TASK: "CREATE_TASK",
  DELETE_ORGANIZATION: "DELETE_ORGANIZATION",
  DELETE_BUTTONS: "DELETE_BUTTONS",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<OrganizationRole, readonly Permission[]> = {
  OWNER: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.ROLE_MANAGEMENT,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.DELETE_ORGANIZATION,
    PERMISSIONS.DELETE_BUTTONS,
  ],
  ADMIN: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.CREATE_TASK,
  ],
  MEMBER: [PERMISSIONS.CREATE_TASK],
  VIEWER: [],
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

export function canShowManageMembers(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.MANAGE_MEMBERS);
}

export function canShowRoleManagement(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.ROLE_MANAGEMENT);
}

export function canShowCreateTask(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.CREATE_TASK);
}

export function canShowDeleteOrganization(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.DELETE_ORGANIZATION);
}

export function canShowDeleteButtons(role: OrganizationRole | null | undefined) {
  return hasPermission(role, PERMISSIONS.DELETE_BUTTONS);
}
