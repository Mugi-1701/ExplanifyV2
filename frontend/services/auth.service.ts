/**
 * Authentication service layer
 * API endpoints for login, register, refresh, and logout
 */

import { api } from "./api";
import { persistTokens, clearAuthStorage } from "@/lib/token";
import type { LoginInput, RegisterInput, AuthPayload } from "@/types/auth.types";

/**
 * Parse auth response from backend
 */
function parseAuthPayload(rawData: unknown): AuthPayload {
  const resolved =
    rawData &&
    typeof rawData === "object" &&
    "data" in rawData &&
    rawData.data &&
    typeof rawData.data === "object"
      ? (rawData.data as Record<string, unknown>)
      : (rawData as Record<string, unknown>);

  const accessToken = resolved?.accessToken;
  const refreshToken = resolved?.refreshToken;
  const user = resolved?.user;
  const organization = resolved?.organization;

  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    throw new Error("Invalid auth response from server");
  }

  return {
    accessToken,
    refreshToken,
    user: user as AuthPayload["user"],
    organization: (organization as AuthPayload["organization"]) ?? null,
  };
}

/**
 * Convert API errors to readable messages
 */
function toReadableError(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object"
  ) {
    const data = error.response.data as Record<string, unknown>;
    if ("error" in data && typeof data.error === "string") {
      return data.error;
    }
    if ("message" in data && typeof data.message === "string") {
      return data.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Login with email and password
 */
export async function login(input: LoginInput): Promise<AuthPayload> {
  try {
    const response = await api.post("/auth/login", input);
    const payload = parseAuthPayload(response.data);
    persistTokens(payload.accessToken, payload.refreshToken);
    return payload;
  } catch (error) {
    throw new Error(toReadableError(error, "Unable to login. Please check your credentials."));
  }
}

/**
 * Register new account
 */
export async function register(input: RegisterInput): Promise<AuthPayload> {
  try {
    const response = await api.post("/auth/register", input);
    const payload = parseAuthPayload(response.data);
    persistTokens(payload.accessToken, payload.refreshToken);
    return payload;
  } catch (error) {
    throw new Error(toReadableError(error, "Unable to create account. Please try again."));
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthPayload | null> {
  try {
    const response = await api.post("/auth/refresh", { refreshToken });
    const payload = parseAuthPayload(response.data);
    persistTokens(payload.accessToken, payload.refreshToken);
    return payload;
  } catch {
    clearAuthStorage();
    return null;
  }
}

/**
 * Logout and clear auth state
 */
export async function logout(): Promise<void> {
  try {
    // Optionally notify server
    await api.post("/auth/logout").catch(() => {
      // Ignore logout endpoint errors
    });
  } finally {
    clearAuthStorage();
  }
}

/**
 * Validate current session
 */
export async function validateSession(): Promise<AuthPayload | null> {
  try {
    const response = await api.get("/auth/me");
    const data = response.data?.data || response.data;
    return {
      user: data?.user,
      accessToken: "",
      refreshToken: "",
    };
  } catch {
    return null;
  }
}

const authService = {
  login,
  register,
  refreshAccessToken,
  logout,
  validateSession,
};

export default authService;
