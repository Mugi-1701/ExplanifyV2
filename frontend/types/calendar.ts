export type CalendarTaskLink = {
  id: string;
  title: string;
  status: string;
  projectId?: string | null;
  assigneeId?: string | null;
  createdById?: string | null;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  userId: string;
  taskId?: string | null;
  task?: CalendarTaskLink | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateCalendarEventInput = {
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  taskId?: string | null;
};

export type UpdateCalendarEventInput = Partial<CreateCalendarEventInput>;
