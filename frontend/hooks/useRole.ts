"use client";

import { useMemo } from "react";

import { getActiveOrganizationRole, type OrganizationRole } from "@/lib/rbac";
import { useAuth } from "@/hooks/useAuth";

export function useRole(): OrganizationRole | null {
  const { accessToken } = useAuth();

  return useMemo(() => {
    void accessToken;
    return getActiveOrganizationRole();
  }, [accessToken]);
}

export default useRole;
