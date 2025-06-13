import { z } from "zod";

export const eventCategories = ['deadline', 'quiz', 'other'] as const;
export type EventCategory = typeof eventCategories[number];

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  isAdmin: z.boolean().default(false),
});

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(eventCategories),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  location: z.string().optional(),
  createdById: z.string(),
});

export const resourceSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  filename: z.string(),
  originalName: z.string(),
  filePath: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  uploadedAt: z.date(),
  uploadedById: z.string(),
});

export const notificationSchema = z.object({
  id: z.string(),
  eventId: z.string().optional(),
  message: z.string(),
  notifyAt: z.preprocess(arg => new Date(arg as string), z.date()),
  sent: z.boolean().default(false),
});


export const insertUserSchema = userSchema.omit({ id: true }).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const insertEventSchema = eventSchema.omit({ id: true }).pick({
  title: true,
  description: true,
  category: true,
  date: true,
  time: true,
  location: true,
  createdById: true,
});

export const insertResourceSchema = resourceSchema.omit({ id: true, uploadedAt: true }).extend({
    fileSize: z.number().positive("File size must be positive"),
});


export const insertNotificationSchema = notificationSchema.omit({ id: true, sent: true });


export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = z.infer<typeof eventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Resource = z.infer<typeof resourceSchema>;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;