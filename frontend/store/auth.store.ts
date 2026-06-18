/**
 * Zustand auth store
 * Centralized authentication state management with persistence
 * Handles user, tokens, loading states, and auth actions
 * 
 * CRITICAL: initializeAuth() MUST complete and set isLoading = false
 * to prevent infinite loaders in protected routes
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getToken, setToken, clearAuthStorage, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, persistTokens } from "@/lib/token";
import type { AuthState, AuthUser } from "@/types/auth.types";

type AuthStore = AuthState & {
  setAuth: (payload: { user?: AuthUser; accessToken: string; refreshToken?: string }) => void;
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
};

// Simple auth store: track tokens and auth flag based on access token presence.
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // Initialize directly from storage (if available)
      user: null,
      accessToken: getToken(AUTH_TOKEN_KEY),
      refreshToken: getToken(REFRESH_TOKEN_KEY),
      isAuthenticated: !!getToken(AUTH_TOKEN_KEY),
      isLoading: false,

      // Actions
      setAuth: (payload) => {
        const { user, accessToken, refreshToken } = payload;
        // Persist tokens to storage
        persistTokens(accessToken, refreshToken || "");

        set((state) => ({
          user: user !== undefined ? user : state.user,
          accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
          isLoading: false,
        }));
      },

      setUser: (user) => {
        set({ user });
      },

      setAccessToken: (token) => {
        setToken(AUTH_TOKEN_KEY, token);
        set({ accessToken: token, isAuthenticated: true });
      },

      logout: () => {
        clearAuthStorage();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;
