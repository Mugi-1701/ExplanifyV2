/**
 * Production Axios instance with auth handling
 * Automatically attaches tokens, refreshes on 401, and queues retries
 * 
 * CRITICAL SAFETY:
 * - Tracks refresh attempts to prevent infinite loops
 * - Limits retries per request to prevent cascade failures
 * - Clears session on refresh failure to break retry cycles
 */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, clearAuthStorage, getToken } from "@/lib/token";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth.store";
import { emitToast } from "@/lib/toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const AUTH_REFRESH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];
const AUTH_EXPIRED_EVENT = "explanify:auth-expired";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let refreshRequest: Promise<string | null> | null = null;
let authExpiredNotified = false;

function isAuthEndpoint(url?: string) {
  return AUTH_REFRESH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
}

function applyBearerToken(config: RetryableRequestConfig) {
  const token = getToken(AUTH_TOKEN_KEY);

  if (!token) {
    return config;
  }

  config.headers = config.headers || {};

  if (typeof (config.headers as { set?: (key: string, value: string) => void }).set === "function") {
    (config.headers as { set: (key: string, value: string) => void }).set("Authorization", `Bearer ${token}`);
  } else {
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return config;
}

async function refreshSessionToken(): Promise<string | null> {
  if (refreshRequest) {
    return refreshRequest;
  }

  refreshRequest = (async () => {
    const refreshToken = getToken(REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      return null;
    }

    const { refreshAccessToken } = await import("@/services/auth.service");
    const refreshed = await refreshAccessToken(refreshToken);

    if (!refreshed?.accessToken) {
      return null;
    }

    authExpiredNotified = false;
    useAuthStore.getState().setAuth({
      user: refreshed.user,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
    });

    return refreshed.accessToken;
  })().finally(() => {
    refreshRequest = null;
  });

  return refreshRequest;
}

function notifyAuthExpired() {
  clearAuthStorage();
  queryClient.clear();
  useAuthStore.getState().logout();

  if (authExpiredNotified) {
    return;
  }

  authExpiredNotified = true;
  emitToast({
    title: "Session expired",
    description: "Please log in again to continue.",
    variant: "error",
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

// Simplified axios client for development: attaches Bearer token from localStorage.
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => applyBearerToken(config as RetryableRequestConfig));

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url;

    if (!originalRequest || status !== 401 || isAuthEndpoint(requestUrl)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      notifyAuthExpired();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const nextToken = await refreshSessionToken();

      if (!nextToken) {
        notifyAuthExpired();
        return Promise.reject(error);
      }

      applyBearerToken(originalRequest);
      return api.request(originalRequest);
    } catch (refreshError) {
      notifyAuthExpired();
      return Promise.reject(refreshError instanceof AxiosError ? refreshError : error);
    }
  }
);

export { AUTH_EXPIRED_EVENT, api };
export default api;
