import { api } from "@/lib/api";
import type { CalendarEvent, CreateCalendarEventInput, UpdateCalendarEventInput } from "@/types/calendar";

function unwrapCalendarResponse(responseData: unknown): CalendarEvent[] {
  if (Array.isArray(responseData)) {
    return responseData as CalendarEvent[];
  }

  if (responseData && typeof responseData === "object" && "data" in responseData) {
    const data = (responseData as { data?: CalendarEvent | CalendarEvent[] }).data;
    return Array.isArray(data) ? data : data ? [data] : [];
  }

  return [];
}

async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const { data } = await api.get("/calendar/events");
  return unwrapCalendarResponse(data);
}

async function getCalendarEventById(eventId: string): Promise<CalendarEvent> {
  const { data } = await api.get(`/calendar/events/${eventId}`);
  const [event] = unwrapCalendarResponse(data);
  if (!event) {
    throw new Error("Calendar event not found");
  }
  return event;
}

async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CalendarEvent> {
  // Debug trace for timezone payload verification.
  // eslint-disable-next-line no-console
  console.log("[calendar.service] create payload", input);
  const { data } = await api.post("/calendar/events", input);
  const [event] = unwrapCalendarResponse(data);
  if (!event) {
    throw new Error("Failed to create calendar event");
  }
  return event;
}

async function updateCalendarEvent(eventId: string, input: UpdateCalendarEventInput): Promise<CalendarEvent> {
  // Debug trace for timezone payload verification.
  // eslint-disable-next-line no-console
  console.log("[calendar.service] update payload", { eventId, input });
  const { data } = await api.patch(`/calendar/events/${eventId}`, input);
  const [event] = unwrapCalendarResponse(data);
  if (!event) {
    throw new Error("Failed to update calendar event");
  }
  return event;
}

async function deleteCalendarEvent(eventId: string): Promise<void> {
  await api.delete(`/calendar/events/${eventId}`);
}

export {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEventById,
  getCalendarEvents,
  updateCalendarEvent,
};
