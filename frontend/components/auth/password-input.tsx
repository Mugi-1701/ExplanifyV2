"use client";

import { useId, useState } from "react";
import type React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;
type PasswordInputExtendedProps = PasswordInputProps & {
  invalid?: boolean;
};

function PasswordInput({ className, id, invalid = false, ...props }: PasswordInputExtendedProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        id={inputId}
        type={isVisible ? "text" : "password"}
        aria-invalid={invalid || props["aria-invalid"]}
        className={cn(invalid ? "border-rose-400/40 focus:border-rose-300/60 focus:ring-rose-500/20" : null, "pr-12", className)}
      />
      <button
        type="button"
        aria-controls={inputId}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute inset-y-0 right-3 flex w-8 items-center justify-center rounded-full text-violet-300 transition hover:bg-white/5 hover:text-violet-200"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export { PasswordInput };
