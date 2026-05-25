const AUTH_TOKEN_KEY = "explanify_access_token";
const REFRESH_TOKEN_KEY = "explanify_refresh_token";
const ACTIVE_PROJECT_KEY = "explanify_active_project_id";

function readStoredValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeStoredValue(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeStoredValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
}

function writeCookie(key: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  if (typeof document === "undefined") {
    return;
  }
  // Intentionally left blank during auth stabilization: do not write cookies.
}

function removeCookie(key: string) {
  if (typeof document === "undefined") {
    return;
  }
  // Intentionally left blank during auth stabilization: do not remove cookies.
}

function persistAuthTokens(accessToken: string, refreshToken: string) {
  writeStoredValue(AUTH_TOKEN_KEY, accessToken);
  writeStoredValue(REFRESH_TOKEN_KEY, refreshToken);
  // Do not write cookies; rely only on localStorage for the access token
  // while we stabilize the client-side auth flow.
}

function clearAuthStorage() {
  removeStoredValue(AUTH_TOKEN_KEY);
  removeStoredValue(REFRESH_TOKEN_KEY);
  removeStoredValue(ACTIVE_PROJECT_KEY);
  // Do not touch cookies during stabilization.
}

export {
  ACTIVE_PROJECT_KEY,
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  readStoredValue,
  removeStoredValue,
  writeCookie,
  removeCookie,
  persistAuthTokens,
  clearAuthStorage,
  writeStoredValue,
};