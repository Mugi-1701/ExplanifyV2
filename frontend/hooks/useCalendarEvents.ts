"use client";

import { useQuery } from "@tanstack/react-query";

import { keepPreviousData, queryDefaults } from "@/lib/query-client";
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents, updateCalendarEvent } from "@/services/calendar.service";
import type { CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput } from "@/types/calendar";

const calendarQueryKey = ["calendar-events"] as const;

function useCalendarEvents() {
  const calendarQuery = useQuery({
    queryKey: calendarQueryKey,
    queryFn: getCalendarEvents,
    staleTime: queryDefaults.staleTime,
    gcTime: queryDefaults.gcTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  return {
    events: calendarQuery.data ?? [],
    loading: calendarQuery.isPending && (calendarQuery.data ?? []).length === 0,
    error: calendarQuery.error instanceof Error ? calendarQuery.error.message : null,
    isFetching: calendarQuery.isFetching,
    refetch: async () => {
      await calendarQuery.refetch();
    },
    createEvent: createCalendarEvent,
    updateEvent: updateCalendarEvent,
    deleteEvent: deleteCalendarEvent,
  };
}

export { calendarQueryKey, useCalendarEvents };
export type { CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput };
