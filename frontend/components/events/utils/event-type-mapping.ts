import { Activity, UserPlus, UserMinus, Plus, PencilLine, CheckCircle2, Trash2, UserRoundCheck, FolderPlus } from "lucide-react";
import type { ComponentType } from "react";
import type { EventLog, EventType } from "../types";

type EventPresentation = {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
};

const EVENT_TYPE_MAP: Record<EventType, EventPresentation> = {
  PROJECT_CREATED: { title: "Project created", icon: FolderPlus, tone: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" },
  PROJECT_UPDATED: { title: "Project updated", icon: PencilLine, tone: "border-blue-400/20 bg-blue-500/10 text-blue-200" },
  TASK_CREATED: { title: "Task created", icon: Plus, tone: "border-violet-400/20 bg-violet-500/10 text-violet-100" },
  TASK_UPDATED: { title: "Task updated", icon: PencilLine, tone: "border-sky-400/20 bg-sky-500/10 text-sky-100" },
  TASK_COMPLETED: { title: "Task completed", icon: CheckCircle2, tone: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" },
  TASK_DELETED: { title: "Task deleted", icon: Trash2, tone: "border-red-400/20 bg-red-500/10 text-red-100" },
  TASK_ASSIGNED: { title: "Task assigned", icon: UserRoundCheck, tone: "border-amber-400/20 bg-amber-500/10 text-amber-100" },
  MEMBER_ADDED: { title: "Member added", icon: UserPlus, tone: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100" },
  MEMBER_REMOVED: { title: "Member removed", icon: UserMinus, tone: "border-rose-400/20 bg-rose-500/10 text-rose-100" },
};

function isKnownEventType(value: string): value is EventType {
  return value in EVENT_TYPE_MAP;
}

function getEventPresentation(event: Pick<EventLog, "eventType">): EventPresentation {
  if (!isKnownEventType(event.eventType)) {
    return { title: "Activity event", icon: Activity, tone: "border-white/10 bg-white/5 text-white/65" };
  }

  return EVENT_TYPE_MAP[event.eventType];
}

export { EVENT_TYPE_MAP, getEventPresentation, isKnownEventType };
