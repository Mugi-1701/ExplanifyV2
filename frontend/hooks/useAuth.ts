/**
 * Custom hook for accessing auth state and actions
 * Provides type-safe auth context
 */

"use client";

import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    setAuth,
    setUser,
    setAccessToken,
    logout,
  } = useAuthStore();

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,

    // Actions
    setAuth,
    setUser,
    setAccessToken,
    logout,
  };
}

export default useAuth;
