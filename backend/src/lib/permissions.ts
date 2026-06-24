export const PERMISSIONS = {
  CREATE_PROJECT: "CREATE_PROJECT",
  UPDATE_PROJECT: "UPDATE_PROJECT",
  DELETE_PROJECT: "DELETE_PROJECT",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
  CREATE_TASK: "CREATE_TASK",
  UPDATE_TASK: "UPDATE_TASK",
  DELETE_TASK: "DELETE_TASK",
  ASSIGN_TASK: "ASSIGN_TASK",
  VIEW_PROJECT: "VIEW_PROJECT",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ORGANIZATION_ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  VIEWER: "VIEWER",
} as const;

export type OrganizationRole = (typeof ORGANIZATION_ROLES)[keyof typeof ORGANIZATION_ROLES];

type RolePermissionMap = Readonly<Record<OrganizationRole, ReadonlySet<Permission>>>;

const ALL_PERMISSIONS = new Set<Permission>(Object.values(PERMISSIONS));

const ROLE_PERMISSIONS: RolePermissionMap = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: new Set<Permission>([
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.UPDATE_PROJECT,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.UPDATE_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.VIEW_PROJECT,
  ]),
  MEMBER: new Set<Permission>([
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.UPDATE_TASK,
  ]),
  VIEWER: new Set<Permission>([PERMISSIONS.VIEW_PROJECT]),
};

export function hasPermission(role: OrganizationRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions.has(permission);
}

export const permissionMatrix = ROLE_PERMISSIONS;
