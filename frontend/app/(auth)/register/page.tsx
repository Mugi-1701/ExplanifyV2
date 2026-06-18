/**
 * Register Page
 * Modern SaaS registration interface with dark AI-native design
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/auth/password-input";
import { useAuth } from "@/hooks/useAuth";
import * as authService from "@/services/auth.service";
import type { RegisterInput } from "@/types/auth.types";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  function isStrongPassword(pwd: string): boolean {
    return /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) && pwd.length >= 8;
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const nextErrors: typeof fieldErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!isStrongPassword(password)) {
      nextErrors.password = "Use 8+ chars with a lowercase letter, number, and symbol";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      const payload = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        orgName: orgName.trim() || undefined,
      } as RegisterInput);
      setAuth(payload);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-4 py-10">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.15),transparent_28%),linear-gradient(to_bottom,#050816,#050816)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-violet-200/60">Explanify</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">Create your account</h1>
          <p className="mt-2 text-sm text-white/50">Start explainable AI coordination today</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_48px_rgba(59,130,246,0.16)] backdrop-blur-2xl"
        >
          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-white/80">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    setFieldErrors((current) => ({ ...current, name: undefined }));
                  }
                }}
                placeholder="John Doe"
                aria-invalid={Boolean(fieldErrors.name)}
                className="h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 shadow-sm backdrop-blur-xl transition focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                disabled={loading}
              />
              {fieldErrors.name ? <p className="mt-2 text-xs text-rose-200">{fieldErrors.name}</p> : null}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((current) => ({ ...current, email: undefined }));
                  }
                }}
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                className="h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 shadow-sm backdrop-blur-xl transition focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                disabled={loading}
              />
              {fieldErrors.email ? <p className="mt-2 text-xs text-rose-200">{fieldErrors.email}</p> : null}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
                Password
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                  }
                }}
                placeholder="********"
                autoComplete="new-password"
                invalid={Boolean(fieldErrors.password)}
                className="placeholder:text-white/30"
                disabled={loading}
              />
              {fieldErrors.password ? <p className="mt-2 text-xs text-rose-200">{fieldErrors.password}</p> : null}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-white/80">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((current) => ({ ...current, confirmPassword: undefined }));
                  }
                }}
                placeholder="********"
                autoComplete="new-password"
                invalid={Boolean(fieldErrors.confirmPassword)}
                className="placeholder:text-white/30"
                disabled={loading}
              />
              {fieldErrors.confirmPassword ? <p className="mt-2 text-xs text-rose-200">{fieldErrors.confirmPassword}</p> : null}
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="orgName" className="mb-2 block text-sm font-medium text-white/80">
                Workspace Name (Optional)
              </label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="My Company"
                className="h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 shadow-sm backdrop-blur-xl transition focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="h-11 w-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-sm font-medium text-white shadow-[0_0_24px_rgba(168,85,247,0.36)] transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="inline size-4 animate-spin" /> : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-violet-200 transition hover:text-violet-100">
              Login
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
