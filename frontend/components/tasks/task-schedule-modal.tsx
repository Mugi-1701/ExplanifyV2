"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Task } from "@/types/task";
import type { ScheduleTaskInput } from "@/types/task";

type TaskScheduleModalProps = {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: (input: ScheduleTaskInput) => Promise<void>;
};

function TaskScheduleModal({ open, task, onClose, onSubmit }: TaskScheduleModalProps) {
  const initial = useMemo(
    () => ({
      date: "",
      startTime: "09:00",
      durationMinutes: 60,
    }),
    []
  );
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    setValues({ ...initial, date });
    setError(null);
  }, [initial, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task || !values.date || !values.startTime || !values.durationMinutes) {
      setError("Date, start time, and duration are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        date: values.date,
        startTime: values.startTime,
        durationMinutes: values.durationMinutes,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to schedule task.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} title="Schedule task" description={task ? `Schedule ${task.title} into your calendar.` : "Schedule this task into your calendar."} size="md">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.18em] text-white/45">Date</label>
          <input
            type="date"
            value={values.date}
            onChange={(event) => setValues((current) => ({ ...current, date: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-white/45">Start Time</label>
            <input
              type="time"
              value={values.startTime}
              onChange={(event) => setValues((current) => ({ ...current, startTime: event.target.value }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-white/45">Duration (minutes)</label>
            <input
              type="number"
              min={15}
              step={15}
              value={values.durationMinutes}
              onChange={(event) => setValues((current) => ({ ...current, durationMinutes: Number(event.target.value) }))}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
            />
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white">
            {submitting ? "Scheduling..." : "Schedule"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export { TaskScheduleModal };
