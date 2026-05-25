/**
 * Authentication type definitions
 * Contracts for auth state, API responses, and form inputs
 */

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthPayload = {
  user?: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  orgName?: string;
};

export type RefreshInput = {
  refreshToken: string;
};

export type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export type AuthError = {
  message: string;
  status?: number;
  code?: string;
};
