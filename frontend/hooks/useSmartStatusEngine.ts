"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import * as taskService from "@/services/task.service";
import { transitionTask } from "@/lib/transition-task";
import type { Task } from "@/types/task";
import { STATUS_TIMEOUTS } from "@/lib/status-timeouts";

/**
 * AI-assisted status progression engine.
 * Detects patterns and suggests status changes to help users move work forward.
 */

type SmartStatusSuggestion = {
  type: "INACTIVITY" | "COMPLETION_SUGGESTION" | "PAUSED_REMINDER";
  taskId: string;
  taskTitle: string;
  reason: string;
  suggestedAction:
    | "MOVE_TO_REVIEW"
    | "PAUSE_TASK"
    | "KEEP_WORKING"
    | "MARK_COMPLETE"
    | "RESUME"
    | "ARCHIVE"
    | "IGNORE";
};

type TaskInteractionTracker = {
  lastInteractionTime: number;
  lastViewTime: number;
  interactionCount: number;
  statusChangeCount: number;
  reviewEnteredAt?: number | null;
  // user-initiated pause metadata — when user intentionally paused the task via AI Pause or UI
  pausedByUser?: boolean;
  pausedAt?: number | null;
  archived?: boolean;
  createdAt: number;
};

// Time thresholds — centralized in STATUS_TIMEOUTS
const COOLDOWN_MS = process.env.NODE_ENV === "development" ? 15 * 1000 : 5 * 60 * 1000;
const INTERACTION_DECAY_MS = process.env.NODE_ENV === "development" ? 30 * 1000 : 15 * 60 * 1000; // shorter decay in dev
// Suppression after user pause — do not show READY/start/inactivity suggestions during this window
const PAUSE_SUPPRESSION_MS = process.env.NODE_ENV === "development" ? 30 * 1000 : 15 * 60 * 1000;
// Use centralized timeouts for status-specific thresholds
const INACTIVITY_THRESHOLD_MS = STATUS_TIMEOUTS.IN_PROGRESS;
const IN_REVIEW_THRESHOLD_MS = STATUS_TIMEOUTS.IN_REVIEW;
const DORMANT_REMINDER_MS = STATUS_TIMEOUTS.PAUSED;

function useSmartStatusEngine(
  tasks: Task[],
  projectId: string | null | undefined,
  onSuggestion?: (suggestion: SmartStatusSuggestion) => void
) {
  const queryClient = useQueryClient();
  const trackerRef = useRef<Map<string, TaskInteractionTracker>>(new Map());
  const lastSuggestionRef = useRef<Map<string, number>>(new Map());
  const prevStatusRef = useRef<Map<string, Task["status"]>>(new Map());
  const [lastSuggestion, setLastSuggestion] = useState<SmartStatusSuggestion | null>(null);

  /**
   * Record user interaction with a task
   */
  const recordInteraction = useCallback((taskId: string) => {
    const now = Date.now();
    const current = trackerRef.current.get(taskId) || {
      lastInteractionTime: now,
      lastViewTime: now,
      interactionCount: 0,
      statusChangeCount: 0,
      createdAt: now,
    };

    trackerRef.current.set(taskId, {
      ...current,
      lastInteractionTime: now,
      lastViewTime: now,
      interactionCount: current.interactionCount + 1,
    });
  }, []);

  /**
   * Record status change
   */
  const recordStatusChange = useCallback((taskId: string) => {
    const now = Date.now();
    const current = trackerRef.current.get(taskId) || {
      lastInteractionTime: now,
      lastViewTime: now,
      interactionCount: 0,
      statusChangeCount: 0,
      createdAt: now,
    };

    trackerRef.current.set(taskId, {
      ...current,
      statusChangeCount: current.statusChangeCount + 1,
      lastInteractionTime: now,
    });
  }, []);

  /**
   * Reset the work-session tracker when a task enters IN_PROGRESS.
   * A status transition is user activity, so timers and suggestion cooldowns
   * must start from a clean slate.
   */
  const resetInProgressSession = useCallback((taskId: string) => {
    const now = Date.now();

    trackerRef.current.set(taskId, {
      lastInteractionTime: now,
      lastViewTime: now,
      interactionCount: 0,
      statusChangeCount: 0,
      createdAt: now,
      pausedByUser: false,
      pausedAt: null,
      archived: false,
    });

    lastSuggestionRef.current.delete(taskId);
  }, []);

  /**
   * Reset smart status tracking after any manual status change.
   * This treats the status change itself as activity and starts a fresh
   * monitoring cycle for the task's new state.
   */
  const resetActivityForStatusChange = useCallback((taskId: string, nextStatus: Task["status"]) => {
    if (nextStatus === "BLOCKED") {
      return;
    }

    const now = Date.now();

    trackerRef.current.set(taskId, {
      lastInteractionTime: now,
      lastViewTime: now,
      interactionCount: 0,
      statusChangeCount: 1,
      reviewEnteredAt: nextStatus === "IN_REVIEW" ? now : null,
      createdAt: now,
      pausedByUser: false,
      pausedAt: null,
      archived: false,
    });

    lastSuggestionRef.current.delete(taskId);
  }, []);

  /**
   * Check if task has a cooldown active
   */
  const hasCooldown = useCallback((taskId: string): boolean => {
    const lastSuggestionTime = lastSuggestionRef.current.get(taskId) ?? 0;
    return Date.now() - lastSuggestionTime < COOLDOWN_MS;
  }, []);

  const isSuppressed = useCallback((taskId: string) => {
    const tracker = trackerRef.current.get(taskId);
    if (!tracker) return false;
    if (tracker.pausedByUser && tracker.pausedAt) {
      return Date.now() - tracker.pausedAt < PAUSE_SUPPRESSION_MS;
    }
    return false;
  }, []);

  const recordPaused = useCallback((taskId: string) => {
    const now = Date.now();
    const current = trackerRef.current.get(taskId) || {
      lastInteractionTime: now,
      lastViewTime: now,
      interactionCount: 0,
      statusChangeCount: 0,
      createdAt: now,
    };

    trackerRef.current.set(taskId, {
      ...current,
      pausedByUser: true,
      pausedAt: now,
    });
  }, []);

  /**
   * Suggest moving task to review (completion signal)
   */
  const suggestMoveToReview = useCallback(
    async (task: Task, reason: string) => {
      if (hasCooldown(task.id)) {
        return;
      }

      const suggestion: SmartStatusSuggestion = {
        type: "COMPLETION_SUGGESTION",
        taskId: task.id,
        taskTitle: task.title,
        reason,
        suggestedAction: "MOVE_TO_REVIEW",
      };

      setLastSuggestion(suggestion);
      lastSuggestionRef.current.set(task.id, Date.now());
      onSuggestion?.(suggestion);
    },
    [hasCooldown, onSuggestion]
  );

  /**
   * Suggest pause or review for inactivity
   */
  const suggestInactivityAction = useCallback(
    async (task: Task) => {
      if (hasCooldown(task.id)) {
        return;
      }

      // respect temporary pause suppression set when user pauses the task
      const pauseTracker = trackerRef.current.get(task.id);
      if (pauseTracker?.pausedByUser && pauseTracker.pausedAt && Date.now() - pauseTracker.pausedAt < PAUSE_SUPPRESSION_MS) {
        return;
      }

      const suggestion: SmartStatusSuggestion = {
        type: "INACTIVITY",
        taskId: task.id,
        taskTitle: task.title,
        reason: `No activity for ${Math.round(INACTIVITY_THRESHOLD_MS / 60000)} minutes.`,
        suggestedAction: "MOVE_TO_REVIEW",
      };

      setLastSuggestion(suggestion);
      lastSuggestionRef.current.set(task.id, Date.now());
      onSuggestion?.(suggestion);
    },
    [hasCooldown, onSuggestion]
  );

  /**
   * Detect completion signals
   */
  const detectCompletionSignals = useCallback(
    (task: Task) => {
      // Signal 1: All dependencies completed
      const allDepsCompleted =
        task.dependencies &&
        task.dependencies.length > 0 &&
        task.dependencies.every((dep) => dep.dependsOnTask?.status === "DONE");

      if (allDepsCompleted && task.status === "IN_PROGRESS") {
        // Respect temporary user pause suppression
        const pauseTracker = trackerRef.current.get(task.id);
        if (!(pauseTracker?.pausedByUser && pauseTracker.pausedAt && Date.now() - pauseTracker.pausedAt < PAUSE_SUPPRESSION_MS)) {
          suggestMoveToReview(task, "All dependencies completed. Task may be ready for review.");
        }
        return;
      }

      // Signal 2: High interaction count + long session
      const tracker = trackerRef.current.get(task.id);
      if (tracker && task.status === "IN_PROGRESS") {
        const sessionDuration = Date.now() - tracker.createdAt;
        const isLongSession = sessionDuration > 30 * 60 * 1000; // 30 minutes
        const highInteractions = tracker.interactionCount > 20;

        if (isLongSession && highInteractions) {
          suggestMoveToReview(task, "Long work session with frequent activity. May be close to completion.");
          return;
        }
      }
    },
    [suggestMoveToReview]
  );

  /**
   * Main effect: scan tasks for inactivity and completion signals
   */
  useEffect(() => {
    const now = Date.now();
    const watchedTasks = tasks.filter((task) => task.status === "IN_PROGRESS" || task.status === "IN_REVIEW");

    for (const task of tasks) {
      const previousStatus = prevStatusRef.current.get(task.id);
      if (task.status === "IN_PROGRESS" && previousStatus !== "IN_PROGRESS") {
        resetInProgressSession(task.id);
      }
      prevStatusRef.current.set(task.id, task.status);
    }

    watchedTasks.forEach((task) => {
      const tracker = trackerRef.current.get(task.id);
      const reviewEnteredAt = tracker?.reviewEnteredAt ?? null;
      const elapsedReviewTime = reviewEnteredAt ? now - reviewEnteredAt : null;
      const shouldShowReviewPopup = task.status === "IN_REVIEW" && elapsedReviewTime !== null && elapsedReviewTime >= IN_REVIEW_THRESHOLD_MS;

      if (process.env.NODE_ENV === "development" && task.status === "IN_REVIEW") {
        console.log("[SmartStatusEngine] review eligibility", {
          taskId: task.id,
          status: task.status,
          reviewEnteredAt,
          now,
          elapsedReviewTime,
          timeout: IN_REVIEW_THRESHOLD_MS,
          shouldShowReviewPopup,
        });
      }

      if (!tracker) {
        // First time seeing this task, initialize tracker
        trackerRef.current.set(task.id, {
          lastInteractionTime: now,
          lastViewTime: now,
          interactionCount: 1,
          statusChangeCount: 0,
          reviewEnteredAt: task.status === "IN_REVIEW" ? now : null,
          createdAt: now,
        });
        return;
      }

      // Check for inactivity
      if (task.status === "IN_REVIEW" && !shouldShowReviewPopup) {
        detectCompletionSignals(task);
        return;
      }

      const timeSinceLastInteraction = now - tracker.lastInteractionTime;
      if (timeSinceLastInteraction > INACTIVITY_THRESHOLD_MS) {
        // If the task is in review, suggest completion; otherwise suggest move-to-review/pause
        if (task.status === "IN_REVIEW" && shouldShowReviewPopup) {
          // Respect suppression inside suggestInactivityAction
          // create a slightly different suggestion targeted at review continuation
          if (!hasCooldown(task.id)) {
            const pauseTracker = trackerRef.current.get(task.id);
            if (!(pauseTracker?.pausedByUser && pauseTracker.pausedAt && Date.now() - pauseTracker.pausedAt < PAUSE_SUPPRESSION_MS)) {
                      const suggestion: SmartStatusSuggestion = {
                        type: "INACTIVITY",
                        taskId: task.id,
                        taskTitle: task.title,
                        reason: `No activity in review for ${Math.round(IN_REVIEW_THRESHOLD_MS / 1000)} seconds.`,
                        suggestedAction: "MARK_COMPLETE",
                      };

              setLastSuggestion(suggestion);
              lastSuggestionRef.current.set(task.id, Date.now());
              onSuggestion?.(suggestion);
            }
          }
        } else if (task.status !== "IN_REVIEW") {
          suggestInactivityAction(task);
        }
      }

      // Check for completion signals
      detectCompletionSignals(task);
    });
  }, [tasks, suggestInactivityAction, detectCompletionSignals, resetInProgressSession]);

  // Scan paused tasks for dormant reminders
  useEffect(() => {
    const now = Date.now();

    for (const [taskId, tracker] of trackerRef.current.entries()) {
      if (!tracker.pausedByUser || tracker.archived) continue;
      if (!tracker.pausedAt) continue;

      // Don't re-suggest if recently suggested
      if (hasCooldown(taskId)) continue;

      const timeSincePause = now - tracker.pausedAt;
      if (timeSincePause > DORMANT_REMINDER_MS) {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) continue;

        const suggestion: SmartStatusSuggestion = {
          type: "PAUSED_REMINDER",
          taskId: task.id,
          taskTitle: task.title,
          reason: `This task has been paused for a while.`,
          suggestedAction: "RESUME",
        };

        setLastSuggestion(suggestion);
        lastSuggestionRef.current.set(taskId, Date.now());
        onSuggestion?.(suggestion);
      }
    }
  }, [tasks, onSuggestion, hasCooldown]);

  /**
   * Apply AI suggested status change
   */
  const applySuggestion = useCallback(
    async (
      suggestion: SmartStatusSuggestion,
      action:
        | "MOVE_TO_REVIEW"
        | "PAUSE_TASK"
        | "KEEP_WORKING"
        | "MARK_COMPLETE"
        | "RESUME"
        | "ARCHIVE"
        | "IGNORE"
    ) => {
      if (!projectId) {
        throw new Error("Project ID required");
      }

      // Handle quick local-only actions immediately
      if (action === "KEEP_WORKING") {
        const tracker = trackerRef.current.get(suggestion.taskId);
        if (tracker) {
          trackerRef.current.set(suggestion.taskId, {
            ...tracker,
            lastInteractionTime: Date.now(),
          });
        }
        setLastSuggestion(null);
        return;
      }

      if (action === "IGNORE") {
        lastSuggestionRef.current.set(suggestion.taskId, Date.now());
        setLastSuggestion(null);
        return;
      }

      // For all status transitions, delegate to centralized transitionTask
      // For status transitions we perform optimistic update via transitionTask
      const actionToPass = action === "RESUME" ? "RESUME" : action === "ARCHIVE" ? "ARCHIVE" : action === "PAUSE_TASK" ? "PAUSE_TASK" : action === "MOVE_TO_REVIEW" ? "MOVE_TO_REVIEW" : action === "MARK_COMPLETE" ? "MARK_COMPLETE" : action === "START_TASK" ? "START_TASK" : action;

      const promise = transitionTask({
        queryClient,
        projectId,
        taskId: suggestion.taskId,
        action: actionToPass as any,
      });

      // Immediately update tracker state for responsiveness (optimistic)
      if (action === "PAUSE_TASK") {
        const now = Date.now();
        const current = trackerRef.current.get(suggestion.taskId) || {
          lastInteractionTime: now,
          lastViewTime: now,
          interactionCount: 0,
          statusChangeCount: 0,
          createdAt: now,
        };
        trackerRef.current.set(suggestion.taskId, {
          ...current,
          pausedByUser: true,
          pausedAt: now,
        });
      }

      if (action === "ARCHIVE") {
        const tracker = trackerRef.current.get(suggestion.taskId);
        if (tracker) {
          trackerRef.current.set(suggestion.taskId, {
            ...tracker,
            archived: true,
            pausedByUser: false,
            pausedAt: null,
          });
        }
      }

      // Clear suggestion locally immediately
      setLastSuggestion(null);

      // Run backend sync in background and attach error handling so rejections don't become unhandled
      promise.catch(() => {
        // On error, transitionTask already invalidates cache; we could add logging here if desired
      });

      // Return the promise so callers can optionally await or attach handlers
      return promise;
    },
    [projectId, queryClient]
  );

  return {
    lastSuggestion,
    recordInteraction,
    recordStatusChange,
    resetActivityForStatusChange,
    applySuggestion,
    isSuppressed,
    recordPaused,
  };
}

export type { SmartStatusSuggestion };
export { useSmartStatusEngine };
