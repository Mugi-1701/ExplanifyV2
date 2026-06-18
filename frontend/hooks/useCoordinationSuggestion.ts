"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCoordinationStore, type CoordinationSuggestion } from "@/store/coordination.store";
import { queryKeys } from "@/lib/query-client";
import * as taskService from "@/services/task.service";
import { transitionTask } from "@/lib/transition-task";

function useCoordinationSuggestion(projectId?: string | null) {
  const queryClient = useQueryClient();
  const {
    currentSuggestion,
    isOpen,
    setSuggestion,
    dismissSuggestion,
    setOpen,
  } = useCoordinationStore();

  /**
   * Show a coordination suggestion
   */
  const showSuggestion = useCallback(
    (suggestion: CoordinationSuggestion) => {
      setSuggestion(suggestion);
    },
    [setSuggestion]
  );

  /**
   * Dismiss the current suggestion
   */
  const handleDismiss = useCallback(() => {
    // Close the current suggestion; do not permanently suppress future suggestions
    dismissSuggestion();
  }, [currentSuggestion?.taskId, dismissSuggestion]);

  /**
   * Handle "Start Task" action
   * Updates task status to IN_PROGRESS and triggers coordination recalculation
   */
  const handleStartTask = useCallback(
    async (taskId: string) => {
      // Perform optimistic update and start backend transition in background.
      // This function returns quickly so callers (popups) can dismiss immediately.
      try {
        let effectiveProjectId = projectId;
        if (!effectiveProjectId) {
          const allTasksData = queryClient.getQueryData<any[]>(queryKeys.tasks("__active__"));
          effectiveProjectId = allTasksData?.find((t) => t.id === taskId)?.projectId;
        }

        if (!effectiveProjectId) {
          console.error("Cannot find project ID for task:", taskId);
          throw new Error("Project ID not found");
        }

        // Optimistically update task status and coordinationState in cache for immediate UI feedback
        queryClient.setQueryData<any[]>(queryKeys.tasks(effectiveProjectId), (current = []) =>
          current.map((t) => (t.id === taskId ? { ...t, status: "IN_PROGRESS", coordinationState: "ACTIVE", updatedAt: new Date().toISOString() } : t))
        );

        // Start background transition via centralized engine
        const promise = transitionTask({ queryClient, projectId: effectiveProjectId, taskId, action: "START_TASK" });

        // Handle async errors: rollback or notify as needed
        promise.catch((err) => {
          console.error("Failed to start task:", err);
          // fallback: invalidate queries to refresh cache from server
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks(effectiveProjectId) });
        });

        // Return quickly so popup can dismiss immediately
        return Promise.resolve();
      } catch (error) {
        console.error("Failed to start task:", error);
        return Promise.reject(error);
      }
    },
    [queryClient, projectId]
  );

  /**
   * Process coordination suggestions from API response
   */
  const processSuggestions = useCallback(
    (suggestions: CoordinationSuggestion[]) => {
      if (suggestions && suggestions.length > 0) {
        // Show the first suggestion
        // In future, could queue multiple suggestions
        showSuggestion(suggestions[0]);
      }
    },
    [showSuggestion]
  );

  return {
    currentSuggestion,
    isOpen,
    showSuggestion,
    handleDismiss,
    handleStartTask,
    processSuggestions,
    setOpen,
  };
}

export { useCoordinationSuggestion };
