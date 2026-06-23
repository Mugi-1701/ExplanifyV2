const { z } = require("zod");

const calendarEventBaseSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  taskId: z.string().uuid().optional().nullable(),
});

const createCalendarEventSchema = calendarEventBaseSchema.refine(
  (value) => value.endTime.getTime() > value.startTime.getTime(),
  {
    message: "endTime must be after startTime",
    path: ["endTime"],
  }
);

const updateCalendarEventSchema = calendarEventBaseSchema
  .partial()
  .refine(
    (value) => {
      if (!value.startTime || !value.endTime) {
        return true;
      }
      return value.endTime.getTime() > value.startTime.getTime();
    },
    {
      message: "endTime must be after startTime",
      path: ["endTime"],
    }
  );

const listCalendarEventsSchema = z.object({
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
});

module.exports = {
  createCalendarEventSchema,
  updateCalendarEventSchema,
  listCalendarEventsSchema,
};
