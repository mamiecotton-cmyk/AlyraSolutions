import { pgTable, serial, text, timestamp, boolean, integer, numeric, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull(),
  clientId: integer("client_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  estimatedEndAt: timestamp("estimated_end_at").notNull(),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  nailColorId: integer("nail_color_id"),
  nailDesignNotes: text("nail_design_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const appointmentTechniciansTable = pgTable("appointment_technicians", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull(),
  technicianId: integer("technician_id").notNull(),
  role: text("role").notNull().default("primary"),
});

export const appointmentServicesTable = pgTable("appointment_services", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull(),
  serviceId: integer("service_id").notNull(),
  technicianId: integer("technician_id"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
