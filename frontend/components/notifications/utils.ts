import {
  CheckCircle2,
  FolderPlus,
  UserPlus,
  UserRoundCheck,
  Shield,
  Bell,
} from "lucide-react";
import type { ComponentType } from "react";

import type { NotificationItem, NotificationType } from "./types";

type NotificationPresentation = {
  icon: ComponentType<{ className?: string }>;
  tone: string;
};

const NOTIFICATION_MAP: Record<NotificationType, NotificationPresentation> = {
  TASK_ASSIGNED: { icon: UserRoundCheck, tone: "border-amber-400/20 bg-amber-500/10 text-amber-100" },
  TASK_COMPLETED: { icon: CheckCircle2, tone: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" },
  MEMBER_ADDED: { icon: UserPlus, tone: "border-cyan-400/20 bg-cyan-500/10 text-cyan-100" },
  ROLE_CHANGED: { icon: Shield, tone: "border-violet-400/20 bg-violet-500/10 text-violet-100" },
  PROJECT_CREATED: { icon: FolderPlus, tone: "border-blue-400/20 bg-blue-500/10 text-blue-100" },
};

function getNotificationPresentation(notification: Pick<NotificationItem, "type">) {
  return NOTIFICATION_MAP[notification.type] ?? { icon: Bell, tone: "border-white/10 bg-white/5 text-white/70" };
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export { formatRelativeTime, getNotificationPresentation, NOTIFICATION_MAP };
