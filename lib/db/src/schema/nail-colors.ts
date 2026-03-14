import { pgTable, serial, text, timestamp, boolean, integer, numeric, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nailFinishEnum = pgEnum("nail_finish", [
  "glossy",
  "matte",
  "shimmer",
  "glitter",
  "chrome",
  "holographic",
]);

export const nailColorsTable = pgTable("nail_colors", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  colorCode: text("color_code").notNull(),
  finish: nailFinishEnum("finish").notNull(),
  collection: text("collection"),
  imageUrl: text("image_url"),
  inStock: boolean("in_stock").notNull().default(true),
  stockQuantity: integer("stock_quantity"),
  price: numeric("price", { precision: 10, scale: 2 }),
  isPopular: boolean("is_popular").notNull().default(false),
  tags: jsonb("tags").notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNailColorSchema = createInsertSchema(nailColorsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNailColor = z.infer<typeof insertNailColorSchema>;
export type NailColor = typeof nailColorsTable.$inferSelect;
