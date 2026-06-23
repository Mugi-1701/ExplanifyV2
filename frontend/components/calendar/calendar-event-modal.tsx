"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { CalendarEvent, CreateCalendarEventInput } from "@/types/calendar";

type CalendarEventModalProps = {
  open: boolean;
  mode: "create" | "edit";
  event?: CalendarEvent | null;
  linkedTasks: { id: string; title: string }[];
  onClose: () => void;
  onSubmit: (input: CreateCalendarEventInput) => Promise<void>;
};

function CalendarEventModal({ open, mode, event, linkedTasks, onClose, onSubmit }: CalendarEventModalProps) {
  function toDateTimeLocalValue(isoString: string) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function toUtcIsoFromLocalValue(localValue: string) {
    const date = new Date(localValue);
    return date.toISOString();
  }

  const initial = useMemo(
    () => ({
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      taskId: "",
    }),
    []
  );
  const [values, setValues] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(
      event
        ? {
            title: event.title,
            description: event.description ?? "",
            startTime: toDateTimeLocalValue(event.startTime),
            endTime: toDateTimeLocalValue(event.endTime),
            taskId: event.taskId ?? "",
          }
        : initial
    );
    if (event) {
      // Debug trace for timezone handling while we verify local conversion.
      // eslint-disable-next-line no-console
      console.log("[CalendarEventModal] load event", {
        eventId: event.id,
        startTimeIso: event.startTime,
        startTimeLocal: toDateTimeLocalValue(event.startTime),
        endTimeIso: event.endTime,
        endTimeLocal: toDateTimeLocalValue(event.endTime),
      });
    }
    setError(null);
  }, [event, initial, open]);

  async function handleSubmit(eventObject: React.FormEvent<HTMLFormElement>) {
    eventObject.preventDefault();
    if (!values.title.trim() || !values.startTime || !values.endTime) {
      setError("Title, start time, and end time are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      startTime: toUtcIsoFromLocalValue(values.startTime),
      endTime: toUtcIsoFromLocalValue(values.endTime),
      taskId: values.taskId || undefined,
    };
    // Debug trace for request payload.
    // eslint-disable-next-line no-console
    console.log("[CalendarEventModal] submit payload", {
      mode,
      taskId: event?.taskId ?? null,
      rawValues: values,
      payload,
    });
    try {
      await onSubmit(payload);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save calendar event.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      title={mode === "create" ? "Create calendar event" : "Edit calendar event"}
      description="Schedule an event and optionally link it to a task."
      size="lg"
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <Input
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          placeholder="Event title"
          className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-white/30 md:col-span-2"
        />

        <textarea
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="Description"
          className="min-h-24 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none md:col-span-2"
        />

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Start</span>
          <input
            type="datetime-local"
            value={values.startTime}
            onChange={(event) => setValues((current) => ({ ...current, startTime: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-white/65">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">End</span>
          <input
            type="datetime-local"
            value={values.endTime}
            onChange={(event) => setValues((current) => ({ ...current, endTime: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
          />
        </label>

        <label className="space-y-2 text-sm text-white/65 md:col-span-2">
          <span className="text-xs uppercase tracking-[0.18em] text-white/45">Linked Task</span>
          <select
            value={values.taskId}
            onChange={(event) => setValues((current) => ({ ...current, taskId: event.target.value }))}
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
          >
            <option value="">No linked task</option>
            {linkedTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
        </label>

        {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 md:col-span-2">{error}</div> : null}

        <div className="flex justify-end gap-3 md:col-span-2">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white">
            {submitting ? "Saving..." : mode === "create" ? "Create event" : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export { CalendarEventModal };
