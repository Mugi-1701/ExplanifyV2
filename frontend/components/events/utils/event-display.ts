import type { EventLog, EventType } from "../types";

type EntityContext = {
  taskTitle?: string | null;
  projectName?: string | null;
  memberName?: string | null;
  role?: string | null;
};

type DisplayEvent = {
  headline: string;
  details: string;
  category: "tasks" | "members" | "projects" | "all";
  detailsEnabled: boolean;
  fieldSummary?: Array<{ label: string; before?: string; after?: string; value?: string }>;
};

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function resolveText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function pickTaskTitle(event: EventLog) {
  const metadata = event.metadata ?? {};
  return asString(metadata.taskTitle) ?? asString(metadata.title) ?? asString(metadata.name) ?? null;
}

function pickProjectName(event: EventLog) {
  const metadata = event.metadata ?? {};
  return asString(metadata.projectName) ?? asString(metadata.name) ?? null;
}

function pickMemberName(event: EventLog) {
  const metadata = event.metadata ?? {};
  return asString(metadata.memberName) ?? asString(metadata.userName) ?? asString(metadata.assigneeName) ?? asString(metadata.name) ?? null;
}

function pickRole(event: EventLog) {
  const metadata = event.metadata ?? {};
  return asString(metadata.role);
}

function resolveEntityContext(event: EventLog): EntityContext {
  return {
    taskTitle: pickTaskTitle(event),
    projectName: pickProjectName(event),
    memberName: pickMemberName(event),
    role: pickRole(event),
  };
}

function buildDisplayEvent(event: EventLog): DisplayEvent {
  const context = resolveEntityContext(event);
  const metadata = event.metadata ?? {};

  switch (event.eventType as EventType) {
    case "TASK_CREATED":
      return {
        headline: "Task created",
        details: `Created task "${context.taskTitle ?? "Untitled"}"`,
        category: "tasks",
        detailsEnabled: false,
      };
    case "TASK_UPDATED": {
      const summary = buildTaskUpdatedSummary(metadata);
      return {
        headline: "Task updated",
        details: buildTaskUpdatedDetails(context.taskTitle ?? "Task", summary, metadata),
        category: "tasks",
        detailsEnabled: false,
      };
    }
    case "TASK_COMPLETED":
      return {
        headline: "Task completed",
        details: `Completed task "${context.taskTitle ?? "Untitled"}"`,
        category: "tasks",
        detailsEnabled: false,
      };
    case "TASK_DELETED":
      return {
        headline: "Task deleted",
        details: `Deleted task "${context.taskTitle ?? "Untitled"}"`,
        category: "tasks",
        detailsEnabled: false,
      };
    case "TASK_ASSIGNED": {
      return {
        headline: "Task assigned",
        details: buildTaskAssignedDetails(context.taskTitle ?? "Task", metadata, context.memberName),
        category: "tasks",
        detailsEnabled: false,
      };
    }
    case "MEMBER_ADDED":
      return {
        headline: "Member added",
        details: buildMemberAddedDetails(context, metadata),
        category: "members",
        detailsEnabled: false,
      };
    case "MEMBER_REMOVED":
      return {
        headline: "Member removed",
        details: `${context.memberName ?? "Member"} was removed from the project`,
        category: "members",
        detailsEnabled: false,
      };
    case "PROJECT_CREATED":
      return {
        headline: "Project created",
        details: `Created project "${context.projectName ?? "Untitled"}"`,
        category: "projects",
        detailsEnabled: false,
      };
    case "PROJECT_UPDATED":
      return {
        headline: "Project updated",
        details: buildProjectUpdatedDetails(context.projectName ?? "Project", metadata),
        category: "projects",
        detailsEnabled: false,
      };
    default:
      return {
        headline: "Activity update",
        details: buildFallbackDetails(event),
        category: "all",
        detailsEnabled: false,
      };
  }
}

function buildFallbackDetails(event: EventLog) {
  const metadata = event.metadata ?? {};
  const preferred =
    pickTaskTitle(event) ??
    pickProjectName(event) ??
    pickMemberName(event) ??
    resolveText(metadata.summary) ??
    resolveText(metadata.message) ??
    resolveText(metadata.action) ??
    resolveText(metadata.type);

  if (preferred) {
    return preferred;
  }

  return "Activity recorded";
}

function buildTaskUpdatedSummary(metadata: Record<string, unknown>) {
  const status = getFieldChange(metadata, "status");
  const priority = getFieldChange(metadata, "priority");
  const dueDate = getFieldChange(metadata, "dueDate");

  return {
    status,
    priority,
    dueDate,
  };
}

function buildTaskUpdatedDetails(
  taskTitle: string,
  summary: ReturnType<typeof buildTaskUpdatedSummary>,
  metadata: Record<string, unknown>
) {
  if (summary.status) {
    return `${taskTitle} status changed: ${summary.status.before} → ${summary.status.after}`;
  }

  if (summary.priority) {
    return `${taskTitle} priority changed: ${summary.priority.before} → ${summary.priority.after}`;
  }

  if (summary.dueDate) {
    return `${taskTitle} due date updated`;
  }

  const changedField = getChangedFieldName(metadata);
  if (changedField) {
    return `${taskTitle} ${changedField} updated`;
  }

  return `Updated task "${taskTitle}"`;
}

function buildTaskAssignedDetails(taskTitle: string, metadata: Record<string, unknown>, memberName?: string | null) {
  const previousAssignee =
    getFirstString(metadata, ["previousAssigneeName", "previousAssignee", "oldAssigneeName", "oldAssignee"]) ??
    getFirstString(metadata, ["oldAssigneeId"]) ??
    null;
  const newAssignee =
    getFirstString(metadata, ["newAssigneeName", "newAssignee", "assigneeName", "assignee"]) ??
    memberName ??
    null;

  if (previousAssignee && newAssignee && previousAssignee !== newAssignee) {
    return `${taskTitle} reassigned from ${previousAssignee} → ${newAssignee}`;
  }

  if (newAssignee) {
    return `${taskTitle} assigned to ${newAssignee}`;
  }

  return `Assigned task "${taskTitle}"`;
}

function buildMemberAddedDetails(context: EntityContext, metadata: Record<string, unknown>) {
  const memberName = context.memberName ?? getFirstString(metadata, ["userName", "assigneeName", "memberName", "name"]);
  const role = context.role ?? getFirstString(metadata, ["role"]);

  if (memberName && role) {
    return `${memberName} added as ${formatRole(role)}`;
  }

  if (memberName) {
    return `${memberName} joined the project`;
  }

  return "Member joined the project";
}

function buildProjectUpdatedDetails(projectName: string, metadata: Record<string, unknown>) {
  const changes = metadata.changes && typeof metadata.changes === "object" ? (metadata.changes as Record<string, unknown>) : metadata;

  const nameChange = getFieldChange(changes, "name");
  if (nameChange?.after) {
    return `Project renamed to "${nameChange.after}"`;
  }

  const statusChange = getFieldChange(changes, "status");
  if (statusChange) {
    return `Project status changed: ${statusChange.before} → ${statusChange.after}`;
  }

  const dueDateChange = getFieldChange(changes, "dueDate");
  if (dueDateChange) {
    return "Project deadline updated";
  }

  const descriptionChange = getFieldChange(changes, "description");
  if (descriptionChange) {
    return `${projectName} description updated`;
  }

  return `Updated project "${projectName}"`;
}

function formatRole(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getChangedFieldName(metadata: Record<string, unknown>) {
  const candidates = ["status", "priority", "dueDate", "name", "description", "startDate"];
  for (const candidate of candidates) {
    if (getFieldChange(metadata, candidate)) {
      return candidate === "dueDate" ? "due date" : candidate.replace(/([a-z])([A-Z])/g, "$1 $2");
    }
  }

  return null;
}

function getFieldChange(metadata: Record<string, unknown>, field: string) {
  const direct = parseChangeObject(metadata[field]);
  if (direct) {
    return direct;
  }

  const changes = metadata.changes;
  if (changes && typeof changes === "object" && !Array.isArray(changes)) {
    const nested = parseChangeObject((changes as Record<string, unknown>)[field]);
    if (nested) {
      return nested;
    }
  }

  const before = getFirstString(metadata, [`previous${capitalize(field)}`, `old${capitalize(field)}`, `from${capitalize(field)}`]);
  const after = getFirstString(metadata, [`new${capitalize(field)}`, `next${capitalize(field)}`, `to${capitalize(field)}`]);

  if (!before && !after) {
    return null;
  }

  return {
    before: before ?? "Unknown",
    after: after ?? "Unknown",
  };
}

function parseChangeObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const before = getChangeValue(record, ["from", "previous", "old", "before"]);
  const after = getChangeValue(record, ["to", "next", "new", "after"]);

  if (!before && !after) {
    return null;
  }

  return {
    before: before ?? "Unknown",
    after: after ?? "Unknown",
  };
}

function getChangeValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function getFirstString(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function capitalize(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

export { buildDisplayEvent, resolveEntityContext };
