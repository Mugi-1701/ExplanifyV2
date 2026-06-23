"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, Edit3, Plus, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api-errors";
import { calendarQueryKey, useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useProjects } from "@/hooks/use-projects";
import { CalendarEventModal } from "./calendar-event-modal";
import type { CalendarEvent, CreateCalendarEventInput } from "@/types/calendar";

function CalendarPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { events, loading, error, refetch, createEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { projects } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const linkedTasks = useMemo(
    () =>
      projects.flatMap((project) =>
        (project.tasks ?? []).map((task) => ({
          id: task.id,
          title: `${task.title}${project.name ? ` · ${project.name}` : ""}`,
        }))
      ),
    [projects]
  );
  const currentMonthLabel = useMemo(() => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date()), []);

  const createMutation = useMutation({
    mutationFn: createEvent,
    onMutate: async () => {
      // eslint-disable-next-line no-console
      console.log("[perf] mutation started: createEvent");
    },
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: calendarQueryKey, refetchType: "active" });
      toast({ title: "Event created", variant: "success" });
      // eslint-disable-next-line no-console
      console.log("[perf] mutation finished: createEvent");
    },
    onError: (mutationError) => {
      toast({ title: "Create failed", description: getApiErrorMessage(mutationError, "Unable to create event."), variant: "error" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ eventId, input }: { eventId: string; input: CreateCalendarEventInput }) => updateEvent(eventId, input),
    onMutate: async () => {
      // eslint-disable-next-line no-console
      console.log("[perf] mutation started: updateEvent");
    },
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: calendarQueryKey, refetchType: "active" });
      toast({ title: "Event updated", variant: "success" });
      // eslint-disable-next-line no-console
      console.log("[perf] mutation finished: updateEvent");
    },
    onError: (mutationError) => {
      toast({ title: "Update failed", description: getApiErrorMessage(mutationError, "Unable to update event."), variant: "error" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onMutate: async () => {
      // eslint-disable-next-line no-console
      console.log("[perf] mutation started: deleteEvent");
    },
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: calendarQueryKey, refetchType: "active" });
      toast({ title: "Event deleted", variant: "success" });
      // eslint-disable-next-line no-console
      console.log("[perf] mutation finished: deleteEvent");
    },
    onError: (mutationError) => {
      toast({ title: "Delete failed", description: getApiErrorMessage(mutationError, "Unable to delete event."), variant: "error" });
    },
  });

  const normalizedEvents = Array.isArray(events) ? events : [];
  const handleRefetch = async () => {
    // eslint-disable-next-line no-console
    console.log("[perf] refetch started: calendar");
    await refetch();
    // eslint-disable-next-line no-console
    console.log("[perf] refetch finished: calendar");
  };

  return (
    <PageContainer size="wide">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="hidden-scrollbar space-y-8">
        <SectionHeader
          eyebrow="Calendar"
          title="Plan your week with linked task context."
          description="Create events, attach tasks, and keep your schedule aligned with delivery work."
          action={
            <Button onClick={() => setIsCreateOpen(true)} disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending} className="rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white disabled:opacity-50">
              <Plus className="mr-2 size-4" />
              New Event
            </Button>
          }
        />

        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex items-center gap-2 text-white/70">
            <CalendarDays className="size-4 text-violet-200" />
            <span>{currentMonthLabel}</span>
          </div>
          <Badge variant="blue" className="border-blue-400/20 bg-blue-500/10 text-blue-100">
            {normalizedEvents.length} event{normalizedEvents.length === 1 ? "" : "s"}
          </Badge>
        </div>

        {loading && normalizedEvents.length === 0 ? (
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="p-6 text-sm text-white/55">Loading calendar events...</CardContent>
          </Card>
        ) : error && normalizedEvents.length === 0 ? (
          <Card className="border-white/10 bg-white/[0.03]">
            <CardContent className="space-y-3 p-6">
              <p className="text-sm text-rose-100">{error}</p>
              <Button onClick={() => void handleRefetch()} className="rounded-full bg-white/10 text-white hover:bg-white/15">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : normalizedEvents.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="No calendar events yet"
            description="Create your first event to start planning around tasks and deadlines."
            detail="Linked tasks will appear directly on each event card when you connect them."
            action={
              <Button onClick={() => setIsCreateOpen(true)} className="rounded-full bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                <Plus className="mr-2 size-4" />
                Create event
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {normalizedEvents.map((event) => (
              <MemoizedCalendarEventCard
                key={event.id}
                event={event}
                disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
                onEdit={() => setEditingEvent(event)}
                onDelete={() => void deleteMutation.mutate(event.id)}
              />
            ))}
          </div>
        )}
      </motion.div>

      <CalendarEventModal
        open={isCreateOpen}
        mode="create"
        linkedTasks={linkedTasks}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(input) => createMutation.mutateAsync(input)}
      />

      <CalendarEventModal
        open={Boolean(editingEvent)}
        mode="edit"
        event={editingEvent}
        linkedTasks={linkedTasks}
        onClose={() => setEditingEvent(null)}
        onSubmit={(input) => {
          if (!editingEvent) return Promise.resolve();
          return updateMutation.mutateAsync({ eventId: editingEvent.id, input });
        }}
      />
    </PageContainer>
  );
}

function CalendarEventCard({ event, onEdit, onDelete, disabled }: { event: CalendarEvent; onEdit: () => void; onDelete: () => void; disabled?: boolean }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{event.title}</h3>
            <p className="mt-1 text-sm text-white/60">
              {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="icon-sm" onClick={onEdit} disabled={disabled} className="border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50">
              <Edit3 className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete} disabled={disabled} className="border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {event.description ? <p className="text-sm leading-6 text-white/65">{event.description}</p> : null}

        <div className="flex flex-wrap gap-2">
          {event.task ? (
            <Badge variant="purple" className="border-violet-400/20 bg-violet-500/10 text-violet-100">
              Linked task: {event.task.title}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/60">
              No linked task
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const MemoizedCalendarEventCard = React.memo(CalendarEventCard);

export { CalendarPage };
