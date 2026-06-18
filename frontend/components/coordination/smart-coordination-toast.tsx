"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X, Zap, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CoordinationSuggestion } from "@/store/coordination.store";

type SmartCoordinationToastProps = {
  suggestion: CoordinationSuggestion | null;
  isOpen: boolean;
  onDismiss: () => void;
  onStartTask: (taskId: string) => Promise<void>;
  onTaskStarted?: (taskId: string) => void;
  isLoading?: boolean;
};

function SmartCoordinationToast({
  suggestion,
  isOpen,
  onDismiss,
  onStartTask,
  onTaskStarted,
  isLoading = false,
}: SmartCoordinationToastProps) {
  const [isActing, setIsActing] = useState(false);
  const [autoDismissTimer, setAutoDismissTimer] = useState<NodeJS.Timeout | null>(null);

  // Detect popup mode based on signal
  const isReadyMode = suggestion?.signal?.includes("->READY") || false;
  const isBlockedMode = suggestion?.signal?.includes("->BLOCKED") || false;

  // Auto-dismiss BLOCKED popups after 5 seconds
  useEffect(() => {
    if (isOpen && isBlockedMode && !autoDismissTimer) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 7000);
      setAutoDismissTimer(timer);
    }

    return () => {
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
        setAutoDismissTimer(null);
      }
    };
  }, [isOpen, isBlockedMode, onDismiss, autoDismissTimer]);

  const handleStartTask = async () => {
    if (!suggestion) return;

    setIsActing(true);
    try {
      await onStartTask(suggestion.taskId);
      onTaskStarted?.(suggestion.taskId);
      onDismiss();
    } finally {
      setIsActing(false);
    }
  };

  if (!suggestion || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="coordination-toast-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent backdrop-blur-2xl shadow-[0_0_48px_rgba(168,85,247,0.15),0_0_32px_rgba(59,130,246,0.1)]">
              <div
                className={`h-1 bg-gradient-to-r ${
                  isBlockedMode
                    ? "from-amber-500 via-orange-500 to-red-500"
                    : "from-violet-500 via-blue-500 to-cyan-500"
                }`}
              />

              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                        isBlockedMode
                          ? "border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-orange-500/20"
                          : "border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-blue-500/20"
                      }`}
                    >
                      {isBlockedMode ? (
                        <AlertCircle className="size-5 text-amber-300" />
                      ) : (
                        <Zap className="size-5 text-violet-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-widest text-violet-200/80">
                        {isBlockedMode ? "Dependency Alert" : "AI Coordination Attention"}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-white">
                        {isBlockedMode
                          ? `${suggestion.taskTitle} is blocked`
                          : "Task Ready"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onDismiss}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/5"
                    aria-label="Dismiss"
                  >
                    <X className="size-4 text-white/50 hover:text-white/70" />
                  </button>
                </div>

                <div className="space-y-2">
                  {isBlockedMode ? (
                    <>
                      <p className="text-sm leading-relaxed text-white/80">
                        {suggestion.taskTitle} is now blocked because {suggestion.completedDependencyTitle || "a dependency"} moved back to IN_PROGRESS.
                      </p>
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                        <p className="text-xs text-amber-100">
                          {suggestion.reason || "Waiting for dependency to complete"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed text-white/80">
                        <span className="font-semibold text-white">
                          {suggestion.completedDependencyTitle || "A dependency"}
                        </span>{" "}
                        is complete.{" "}
                        <span className="font-semibold text-white">
                          {suggestion.taskTitle}
                        </span>{" "}
                        is ready to start.
                      </p>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-sm font-medium text-white">
                          {suggestion.taskTitle}
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          {suggestion.reason || "Ready to start work"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {isReadyMode && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={onDismiss}
                      disabled={isActing || isLoading}
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                    >
                      Later
                    </Button>
                    <Button
                      onClick={handleStartTask}
                      disabled={isActing || isLoading}
                      size="sm"
                      className="flex-1 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-sm text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isActing || isLoading ? (
                        <span className="animate-pulse">Activating...</span>
                      ) : (
                        <>
                          Start Task
                          <ChevronRight className="ml-1.5 size-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export { SmartCoordinationToast };
