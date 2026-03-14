import { pgTable, serial, text, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationTypeEnum = pgEnum("notification_type", [
  "appointment_reminder",
  "waitlist_update",
  "loyalty_update",
  "custom",
]);

export const notificationTemplatesTable = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull(),
  name: text("name").notNull(),
  type: notificationTypeEnum("type").notNull(),
  template: text("template").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationLogsTable = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull(),
  recipientPhone: text("recipient_phone").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull(),
  status: text("status").notNull().default("sent"),
  externalMessageId: text("external_message_id"),
  appointmentId: integer("appointment_id"),
  waitlistEntryId: integer("waitlist_entry_id"),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
});

export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplatesTable).omit({ id: true, createdAt: true });
export const insertNotificationLogSchema = createInsertSchema(notificationLogsTable).omit({ id: true, sentAt: true });

export type NotificationTemplate = typeof notificationTemplatesTable.$inferSelect;
export type NotificationLog = typeof notificationLogsTable.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;
