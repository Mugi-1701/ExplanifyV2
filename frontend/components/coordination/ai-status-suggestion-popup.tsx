"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X, Clock, CheckCircle2, BrainCircuit } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SmartStatusSuggestion } from "@/hooks/useSmartStatusEngine";

type AIStatusSuggestionPopupProps = {
  suggestion: SmartStatusSuggestion | null;
  isOpen: boolean;
  onDismiss: () => void;
  onApply: (
    action:
      | "MOVE_TO_REVIEW"
      | "PAUSE_TASK"
      | "KEEP_WORKING"
      | "MARK_COMPLETE"
      | "RESUME"
      | "ARCHIVE"
      | "IGNORE"
  ) => Promise<void>;
  isLoading?: boolean;
};

function AIStatusSuggestionPopup({
  suggestion,
  isOpen,
  onDismiss,
  onApply,
  isLoading = false,
}: AIStatusSuggestionPopupProps) {
  if (!suggestion || typeof document === "undefined") {
    return null;
  }

  const isInactivity = suggestion.type === "INACTIVITY";
  const isPausedReminder = suggestion.type === "PAUSED_REMINDER";
  const icon = isPausedReminder ? <Clock className="size-5 text-amber-300" /> : isInactivity ? <Clock className="size-5 text-amber-300" /> : <CheckCircle2 className="size-5 text-emerald-300" />;
  const header = isPausedReminder
    ? "This task was paused"
    : suggestion.suggestedAction === "MARK_COMPLETE"
    ? "Is review complete?"
    : isInactivity
    ? "Still Working?"
    : "Looks Complete";

  const handleApply = async (
    action:
      | "MOVE_TO_REVIEW"
      | "PAUSE_TASK"
      | "KEEP_WORKING"
      | "MARK_COMPLETE"
      | "RESUME"
      | "ARCHIVE"
      | "IGNORE"
  ) => {
    await onApply(action);
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ai-status-toast-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
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
                  isInactivity ? "from-amber-500 via-yellow-500 to-orange-500" : "from-emerald-500 via-green-500 to-teal-500"
                }`}
              />

              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                        isInactivity
                          ? "border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-yellow-500/20"
                          : "border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-green-500/20"
                      }`}
                    >
                      {isInactivity ? icon : <BrainCircuit className="size-5 text-emerald-300" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                        {isInactivity ? "AI Workflow Assistant" : "AI Completion Assistant"}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-white">{header}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onDismiss}
                    disabled={isLoading}
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/5 disabled:opacity-50"
                    aria-label="Dismiss"
                  >
                    <X className="size-4 text-white/50 hover:text-white/70" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-white/80">
                    <span className="font-semibold text-white">{suggestion.taskTitle}</span> — {suggestion.reason}
                  </p>

                  <div
                    className={`rounded-xl border ${
                      isInactivity || isPausedReminder
                        ? "border-amber-500/20 bg-amber-500/10"
                        : "border-emerald-500/20 bg-emerald-500/10"
                    } p-3`}
                  >
                    <p className={`text-xs ${isInactivity || isPausedReminder ? "text-amber-100" : "text-emerald-100"}`}>
                      {isPausedReminder
                        ? "This task has been paused for a while. Would you like to resume or archive it?"
                        : suggestion.suggestedAction === "MARK_COMPLETE"
                        ? "Has the review been completed? Mark complete to finish this task."
                        : isInactivity
                        ? "Ready to move this task forward?"
                        : "This task may be ready for review or code inspection."}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {isPausedReminder ? (
                    <>
                      <Button
                        onClick={() => handleApply("RESUME")}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                      >
                        Resume
                      </Button>
                      <Button
                        onClick={() => handleApply("ARCHIVE")}
                        disabled={isLoading}
                        size="sm"
                        className="flex-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-sm text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? <span className="animate-pulse">Updating...</span> : <>Archive</>}
                      </Button>
                      <Button
                        onClick={() => handleApply("IGNORE")}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                      >
                        Ignore
                      </Button>
                    </>
                  ) : isInactivity ? (
                    <>
                      <Button
                        onClick={() => handleApply("KEEP_WORKING")}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                      >
                        Keep Working
                      </Button>
                      <Button
                        onClick={() => handleApply(suggestion.suggestedAction === "MARK_COMPLETE" ? "MARK_COMPLETE" : "MOVE_TO_REVIEW")}
                        disabled={isLoading}
                        size="sm"
                        className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-sm text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="animate-pulse">Updating...</span>
                        ) : (
                          <>
                            {suggestion.suggestedAction === "MARK_COMPLETE" ? "Mark Complete" : "Move To Review"}
                            <ChevronRight className="ml-1.5 size-3.5" />
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleApply("PAUSE_TASK")}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                      >
                        Pause Task
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleApply("KEEP_WORKING")}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-full border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                      >
                        Keep Working
                      </Button>
                      <Button
                        onClick={() => handleApply("MOVE_TO_REVIEW")}
                        disabled={isLoading}
                        size="sm"
                        className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-sm text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="animate-pulse">Updating...</span>
                        ) : (
                          <>
                            Move To Review
                            <ChevronRight className="ml-1.5 size-3.5" />
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export { AIStatusSuggestionPopup };
