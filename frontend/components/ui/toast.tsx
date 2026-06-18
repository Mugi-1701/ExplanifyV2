"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type React from "react";

import { TOAST_EVENT, emitToast, type ToastInput, type ToastVariant } from "@/lib/toast";
import { cn } from "@/lib/utils";

type ToastMessage = Required<Pick<ToastInput, "title" | "variant">> &
  Pick<ToastInput, "description"> & {
    id: string;
  };

type ToastContextValue = {
  toast: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue>({
  toast: (toast) => {
    emitToast(toast);
    return "";
  },
  dismiss: () => undefined,
});

const toastStyles: Record<ToastVariant, string> = {
  success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
  error: "border-rose-400/20 bg-rose-500/10 text-rose-100",
  info: "border-blue-400/20 bg-blue-500/10 text-blue-100",
};

const toastIcons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const;

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const message: ToastMessage = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "info",
      };

      setToasts((current) => [...current, message].slice(-4));

      window.setTimeout(() => {
        dismiss(id);
      }, input.durationMs ?? 3800);

      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const handleToast = (event: Event) => {
      const toastEvent = event as CustomEvent<ToastInput>;
      if (toastEvent.detail?.title) {
        toast(toastEvent.detail);
      }
    };

    window.addEventListener(TOAST_EVENT, handleToast);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToast);
    };
  }, [toast]);

  const value = useMemo(() => ({ toast, dismiss }), [dismiss, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((message) => (
            <ToastItem key={message.id} message={message} onDismiss={() => dismiss(message.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: () => void }) {
  const Icon = toastIcons[message.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className={cn(
        "pointer-events-auto overflow-hidden rounded-2xl border p-4 shadow-[0_24px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl",
        toastStyles[message.variant]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{message.title}</p>
          {message.description ? <p className="mt-1 text-sm leading-5 text-white/70">{message.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

function useToast() {
  return useContext(ToastContext);
}

export { ToastProvider, useToast };
