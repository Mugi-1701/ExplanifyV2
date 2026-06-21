import api from "@/services/api";
import type { EventLog, TimelineScope } from "../types";

async function getProjectEvents(projectId: string): Promise<EventLog[]> {
  const { data } = await api.get<{ data: EventLog[] }>(`/events/project/${projectId}`);
  return data.data ?? [];
}

async function getOrganizationEvents(organizationId: string): Promise<EventLog[]> {
  const { data } = await api.get<{ data: EventLog[] }>(`/events/organization/${organizationId}`);
  return data.data ?? [];
}

function getEvents(scope: TimelineScope, id: string) {
  return scope === "project" ? getProjectEvents(id) : getOrganizationEvents(id);
}

export { getEvents, getOrganizationEvents, getProjectEvents };
