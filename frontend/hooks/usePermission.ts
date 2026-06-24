"use client";

import { useMemo } from "react";

import { hasPermission, type Permission } from "@/lib/rbac";
import { useRole } from "@/hooks/useRole";

export function usePermission(permission: Permission): boolean {
  const role = useRole();

  return useMemo(() => hasPermission(role, permission), [permission, role]);
}

export default usePermission;
