"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoginInput, RegisterInput } from "@/types/auth";

type LoginFormProps = {
  mode: "login";
  onSubmit: (values: LoginInput) => Promise<void>;
};

type RegisterFormProps = {
  mode: "register";
  onSubmit: (values: RegisterInput) => Promise<void>;
};

type AuthFormCardProps = LoginFormProps | RegisterFormProps;

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string) {
  return /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) && password.length >= 8;
}

function AuthFormCard({ mode, onSubmit }: AuthFormCardProps) {
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validationError = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return "Email and password are required.";
    }

    if (!isEmailValid(email.trim())) {
      return "Enter a valid email address.";
    }

    if (isRegister && name.trim().length < 2) {
      return "Name must be at least 2 characters.";
    }

    if (isRegister && !isStrongPassword(password)) {
      return "Password must have 8+ chars, lowercase, number, and symbol.";
    }

    if (isRegister && password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  }, [confirmPassword, email, isRegister, name, password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await onSubmit({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          orgName: orgName.trim() || undefined,
        } as RegisterInput);
      } else {
        await onSubmit({
          email: email.trim().toLowerCase(),
          password,
        } as LoginInput);
      }
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError(isRegister ? "Unable to create account." : "Unable to login.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_48px_rgba(59,130,246,0.16)] backdrop-blur-2xl md:p-7"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {isRegister ? (
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Full name"
            autoComplete="name"
            disabled={loading}
          />
        ) : null}

        {isRegister ? (
          <Input
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            placeholder="Workspace name (optional)"
            autoComplete="organization"
            disabled={loading}
          />
        ) : null}

        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={loading}
        />

        <PasswordInput
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          disabled={loading}
        />

        {isRegister ? (
          <PasswordInput
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            disabled={loading}
          />
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-[0_0_24px_rgba(168,85,247,0.36)] hover:opacity-95"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {isRegister ? "Create account" : "Login"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-medium text-violet-200 transition hover:text-violet-100"
        >
          {isRegister ? "Login" : "Create one"}
        </Link>
      </p>
    </motion.div>
  );
}

export { AuthFormCard };
