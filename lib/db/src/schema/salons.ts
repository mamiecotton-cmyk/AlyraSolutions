import { pgTable, serial, text, timestamp, boolean, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const salonStatusEnum = pgEnum("salon_status", [
  "active",
  "inactive",
  "suspended",
]);

export const salonsTable = pgTable("salons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logoUrl: text("logo_url"),
  coverImageUrl: text("cover_image_url"),
  status: salonStatusEnum("status").notNull().default("active"),
  timezone: text("timezone").notNull().default("America/New_York"),
  openingHours: jsonb("opening_hours"),
  ownerId: integer("owner_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSalonSchema = createInsertSchema(salonsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSalon = z.infer<typeof insertSalonSchema>;
export type Salon = typeof salonsTable.$inferSelect;
