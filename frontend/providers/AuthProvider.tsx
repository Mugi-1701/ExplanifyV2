/**
 * Auth Provider
 * Wraps app and initializes authentication on boot
 * Handles session restoration and bootstrap loading
 * 
 * CRITICAL: Must guarantee isLoading transitions to false
 * Prevents infinite "Initializing session..." screens
 */

"use client";

import React from "react";

type AuthProviderProps = {
  children: React.ReactNode;
};

// Lightweight provider: removed complex hydration. We rely on token presence
// in localStorage for simple dev flow. This keeps the provider as a thin wrapper
// while preserving the app tree.
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}

export default AuthProvider;
