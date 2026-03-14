import { pgTable, serial, text, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "waiting",
  "called",
  "serving",
  "completed",
  "left",
]);

export const waitlistTable = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull(),
  clientId: integer("client_id"),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone"),
  partySize: integer("party_size").notNull().default(1),
  serviceIds: jsonb("service_ids").notNull().default([]),
  preferredTechnicianId: integer("preferred_technician_id"),
  status: waitlistStatusEnum("status").notNull().default("waiting"),
  position: integer("position").notNull(),
  estimatedWaitMinutes: integer("estimated_wait_minutes").notNull().default(0),
  notes: text("notes"),
  checkInCode: text("check_in_code").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
});

export const insertWaitlistSchema = createInsertSchema(waitlistTable).omit({
  id: true,
  joinedAt: true,
});

export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type WaitlistEntry = typeof waitlistTable.$inferSelect;
