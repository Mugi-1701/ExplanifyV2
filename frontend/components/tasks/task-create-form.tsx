"use client";

import { useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DependencySelect } from "./dependency-select";
import { getApiErrorMessage } from "@/lib/api-errors";
import { resolveProjectId } from "@/services/task.service";
import type { CreateTaskInput } from "@/types/task";
import type { Task } from "@/types/task";

type TaskCreateFormProps = {
  projectId?: string;
  tasks?: Task[];
  onCreate: (input: CreateTaskInput) => Promise<void>;
};

function TaskCreateForm({ projectId, tasks = [], onCreate }: TaskCreateFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<CreateTaskInput["priority"]>("MEDIUM");
  const [dependsOnTaskId, setDependsOnTaskId] = useState<string | null>(null);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolvedProjectId = projectId ?? resolveProjectId();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        projectId: resolvedProjectId ?? "",
        status: "TODO",
        dependsOnTaskId: dependsOnTaskId || undefined,
        requiredSkills,
      });
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDependsOnTaskId(null);
      setRequiredSkills([]);
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Unable to create task."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-xl text-white">Create task</CardTitle>
        <CardDescription className="text-white/60">Create a new live task in the current project context.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30" />
          <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Task description" className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30" />
          <div className="flex flex-wrap gap-2">
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setPriority(level)}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition ${priority === level ? "border-violet-400/30 bg-violet-500/15 text-violet-100" : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"}`}
              >
                {level}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["Frontend", "Backend", "AI/ML", "UI/UX", "Testing", "DevOps"] as const).map((skill) => {
              const selected = requiredSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setRequiredSkills((current) => (selected ? current.filter((item) => item !== skill) : [...current, skill]))}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition ${selected ? "border-violet-400/30 bg-violet-500/15 text-violet-100" : "border-white/10 bg-white/5 text-white/55 hover:bg-white/10"}`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
          {resolvedProjectId && (
            <DependencySelect
              value={dependsOnTaskId}
              onChange={setDependsOnTaskId}
              tasks={tasks}
            />
          )}
          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
          <Button
            type="submit"
            disabled={submitting || !title.trim() || !resolvedProjectId}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? "Creating..." : resolvedProjectId ? "Create task" : "Set active project"}
          </Button>
          {!resolvedProjectId ? <p className="text-xs text-white/45">Set `explanify_active_project_id` or pass `projectId` to create a task.</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

export { TaskCreateForm };
