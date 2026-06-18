"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { useMutation } from "@tanstack/react-query";

import { AIRecommendationCard } from "@/components/tasks/ai-recommendation-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DependencySelect } from "./dependency-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { recommendAssignee } from "@/services/ai.service";
import type { AIRecommendationData, AIRecommendationPayload } from "@/types/ai";
import type { CreateTaskInput, Task } from "@/types/task";

type TaskCreateValues = {
  title: string;
  description: string;
  priority: NonNullable<CreateTaskInput["priority"]>;
  dependsOnTaskId: string | null;
  dueDate: string;
  estimateHours: string;
  assigneeId: string;
  requiredSkills: string[];
};

type TaskCreateModalProps = {
  open: boolean;
  tasks: Task[];
  assignees: { id: string; name: string; email: string }[];
  projectId?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
};

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const SKILLS = ["Frontend", "Backend", "AI/ML", "UI/UX", "Testing", "DevOps"] as const;

function getSuggestedPriority(dueDate: string) {
  if (!dueDate) return "MEDIUM" as const;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(dueDate);
  deadline.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((deadline.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return "CRITICAL" as const;
  if (diffDays <= 1) return "CRITICAL" as const;
  if (diffDays <= 3) return "HIGH" as const;
  if (diffDays <= 7) return "MEDIUM" as const;
  return "LOW" as const;
}

function getPriorityReason(dueDate: string) {
  if (!dueDate) return "No deadline set yet.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(dueDate);
  deadline.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((deadline.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return "Deadline has passed.";
  if (diffDays <= 1) return "Deadline is within 1 day.";
  if (diffDays <= 3) return "Deadline is within 3 days.";
  if (diffDays <= 7) return "Deadline is within 7 days.";
  return "Deadline is 8 or more days away.";
}

function TaskCreateModal({ open, tasks, assignees, projectId, onClose, onSubmit }: TaskCreateModalProps) {
  const initialValues = useMemo<TaskCreateValues>(
    () => ({
      title: "",
      description: "",
      priority: "MEDIUM",
      dependsOnTaskId: null,
      dueDate: "",
      estimateHours: "",
      assigneeId: "",
      requiredSkills: [],
    }),
    []
  );
  const [values, setValues] = useState<TaskCreateValues>(initialValues);
  const [manualOverride, setManualOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<AIRecommendationData | null>(null);
  const [recommendationApplied, setRecommendationApplied] = useState(false);
  const [appliedRecommendationPayload, setAppliedRecommendationPayload] = useState<AIRecommendationPayload | null>(null);

  const suggestedPriority = useMemo(() => getSuggestedPriority(values.dueDate), [values.dueDate]);
  const effectivePriority = manualOverride ? values.priority : suggestedPriority;
  const priorityReason = useMemo(() => getPriorityReason(values.dueDate), [values.dueDate]);
  const recommendationMutation = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error("projectId is required");
      }

      return recommendAssignee(projectId, values.requiredSkills);
    },
    onMutate: () => {
      setRecommendationError(null);
      setRecommendationApplied(false);
      setAppliedRecommendationPayload(null);
    },
    onSuccess: (data) => {
      setRecommendation(data);
      setRecommendationApplied(false);
      setAppliedRecommendationPayload(null);
    },
    onError: (recommendError) => {
      setRecommendation(null);
      setRecommendationApplied(false);
      setAppliedRecommendationPayload(null);
      setRecommendationError(getApiErrorMessage(recommendError, "Unable to get AI recommendation."));
    },
  });

  useEffect(() => {
    if (!open) return;
    setValues(initialValues);
    setManualOverride(false);
    setError(null);
    setRecommendation(null);
    setRecommendationError(null);
    setRecommendationApplied(false);
    setAppliedRecommendationPayload(null);
  }, [initialValues, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId || !values.title.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        priority: effectivePriority,
        projectId,
        status: "TODO",
        dependsOnTaskId: values.dependsOnTaskId || undefined,
        dueDate: values.dueDate || undefined,
        estimateHours: values.estimateHours ? Number(values.estimateHours) : undefined,
        assigneeId: values.assigneeId || undefined,
        ...(appliedRecommendationPayload ?? {}),
      });
      onClose();
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Unable to create task."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleUseRecommendation() {
    if (!recommendation) {
      return;
    }

    setValues((current) => ({ ...current, assigneeId: recommendation.recommendedUserId }));
    setRecommendationApplied(true);
    setAppliedRecommendationPayload({
      aiRecommendedUserId: recommendation.recommendedUserId,
      aiRecommendationScore: recommendation.score,
      aiRecommendationConfidence: recommendation.confidence.toUpperCase() as "LOW" | "MEDIUM" | "HIGH",
      aiRecommendationExplanation: recommendation.explanation,
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      title="Create task"
      description="Add a new task to the current project with AI-driven priority guidance."
      size="lg"
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Input
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          placeholder="Task title"
          className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30 md:col-span-2"
        />

        <textarea
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="Task description"
          className="min-h-28 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15 md:col-span-2"
        />

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Assign To</span>
          <select
            value={values.assigneeId}
            onChange={(event) => setValues((current) => ({ ...current, assigneeId: event.target.value }))}
            className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          >
            <option value="">Unassigned</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name} ({assignee.email})
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-3 md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-[0.18em] text-white/45">Required Skills</span>
              <p className="text-sm text-white/55">Choose the skills this task needs, then ask AI for a recommended assignee.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void recommendationMutation.mutate()}
              disabled={recommendationMutation.isPending || !projectId}
              className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              {recommendationMutation.isPending ? "AI analyzing..." : "AI Recommend"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => {
              const selected = values.requiredSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      requiredSkills: selected
                        ? current.requiredSkills.filter((item) => item !== skill)
                        : [...current.requiredSkills, skill],
                    }))
                  }
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                    selected ? "border-violet-400/30 bg-violet-500/15 text-violet-100" : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>

          <AIRecommendationCard
            recommendation={recommendation}
            loading={recommendationMutation.isPending}
            error={recommendationError}
            applied={recommendationApplied}
            onUseRecommendation={handleUseRecommendation}
          />
        </div>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Deadline</span>
          <input
            type="date"
            value={values.dueDate}
            onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/15"
          />
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Estimated Duration</span>
          <Input
            type="number"
            min={1}
            step={1}
            value={values.estimateHours}
            onChange={(event) => setValues((current) => ({ ...current, estimateHours: event.target.value }))}
            placeholder="Hours"
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-white/40">Examples: 1h, 2h, 4h, 8h</p>
        </label>

        <div className="space-y-3 md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-[0.18em] text-white/45">Priority</span>
              <p className="text-sm text-white/75">
                AI Suggested Priority: <span className="font-semibold text-white">{suggestedPriority}</span>
                {manualOverride ? (
                  <span className="ml-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-200">
                    Manual Override
                  </span>
                ) : (
                  <span className="ml-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-200">
                    AI Suggested
                  </span>
                )}
              </p>
              <p className="text-xs text-white/40">{priorityReason}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setManualOverride(true)}
              className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Manual Override
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => {
                  setManualOverride(true);
                  setValues((current) => ({ ...current, priority }));
                }}
                className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                  effectivePriority === priority
                    ? "border-violet-400/30 bg-violet-500/15 text-violet-100"
                    : "border-white/10 bg-white/5 text-white/65 hover:bg-white/10"
                }`}
              >
                {priority}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75">
            Selected priority: <span className="font-semibold text-white">{effectivePriority}</span>
            <span className="ml-2 text-white/45">
              {manualOverride ? "Manually overridden by user." : `AI Suggested because: ${priorityReason}`}
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/65 md:col-span-2">
          <DependencySelect
            value={values.dependsOnTaskId}
            onChange={(dependsOnTaskId) => setValues((current) => ({ ...current, dependsOnTaskId }))}
            tasks={tasks}
          />
        </div>

        {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">{error}</div> : null}

        <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !values.title.trim() || !projectId} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50">
            {submitting ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export { TaskCreateModal };
