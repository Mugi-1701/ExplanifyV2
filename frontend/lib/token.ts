/**
 * Token storage and retrieval utilities
 * Secure client-side token management
 */

const TOKEN_PREFIX = "explanify_";
export const AUTH_TOKEN_KEY = `${TOKEN_PREFIX}access_token`;
export const REFRESH_TOKEN_KEY = `${TOKEN_PREFIX}refresh_token`;
export const ACTIVE_PROJECT_KEY = `${TOKEN_PREFIX}active_project_id`;

/**
 * Get token from localStorage (client-side only)
 */
export function getToken(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Set token in localStorage (client-side only)
 */
export function setToken(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(key, value);
  } catch {
    // Silent fail if localStorage unavailable
  }
}

/**
 * Remove token from localStorage (client-side only)
 */
export function removeToken(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch {
    // Silent fail
  }
}

/**
 * Clear all auth tokens and session data
 */
export function clearAuthStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    removeToken(AUTH_TOKEN_KEY);
    removeToken(REFRESH_TOKEN_KEY);
    removeToken(ACTIVE_PROJECT_KEY);
  } catch {
    // Silent fail
  }
}

/**
 * Persist tokens to both localStorage and cookies for middleware
 */
export function persistTokens(accessToken: string, refreshToken: string): void {
  setToken(AUTH_TOKEN_KEY, accessToken);
  setToken(REFRESH_TOKEN_KEY, refreshToken);
  // Intentionally DO NOT write cookies here. During stabilization we rely
  // solely on localStorage to avoid server-side middleware influencing
  // client navigation. If you need cookies later, reintroduce them
  // deliberately.
}

/**
 * Check if token exists (basic auth state)
 */
export function hasAuthToken(): boolean {
  return Boolean(getToken(AUTH_TOKEN_KEY));
}
