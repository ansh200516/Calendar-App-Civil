import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const eventCategories = ['deadline', 'quiz', 'other'] as const;

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: eventCategories }).notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  location: text("location"),
  createdById: integer("created_by_id").references(() => users.id),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id),
  message: text("message"),
  notifyAt: timestamp("notify_at").notNull(),
  sent: boolean("sent").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  title: true,
  description: true,
  category: true,
  date: true,
  time: true,
  location: true,
  createdById: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  eventId: true,
  message: true,
  notifyAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type EventCategory = typeof eventCategories[number];
