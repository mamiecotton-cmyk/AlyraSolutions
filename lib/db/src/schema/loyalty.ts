import { pgTable, serial, text, timestamp, boolean, integer, numeric, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
  "free_service",
]);

export const loyaltyTransactionTypeEnum = pgEnum("loyalty_transaction_type", [
  "earned",
  "redeemed",
  "expired",
  "bonus",
]);

export const loyaltyConfigTable = pgTable("loyalty_config", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull().unique(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  pointsPerDollar: numeric("points_per_dollar", { precision: 5, scale: 2 }).notNull().default("1"),
  pointsPerVisit: integer("points_per_visit").notNull().default(10),
  minimumRedemption: integer("minimum_redemption").notNull().default(100),
  pointsExpireDays: integer("points_expire_days"),
  tierConfig: jsonb("tier_config").notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loyaltyRewardsTable = pgTable("loyalty_rewards", {
  id: serial("id").primaryKey(),
  salonId: integer("salon_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }),
  serviceId: integer("service_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clientLoyaltyTable = pgTable("client_loyalty", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  salonId: integer("salon_id").notNull(),
  totalPoints: integer("total_points").notNull().default(0),
  lifetimePoints: integer("lifetime_points").notNull().default(0),
  visitCount: integer("visit_count").notNull().default(0),
  totalSpent: numeric("total_spent", { precision: 10, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loyaltyTransactionsTable = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  salonId: integer("salon_id").notNull(),
  points: integer("points").notNull(),
  type: loyaltyTransactionTypeEnum("type").notNull(),
  description: text("description").notNull(),
  appointmentId: integer("appointment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoyaltyConfigSchema = createInsertSchema(loyaltyConfigTable).omit({ id: true });
export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewardsTable).omit({ id: true, createdAt: true });
export const insertClientLoyaltySchema = createInsertSchema(clientLoyaltyTable).omit({ id: true });
export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactionsTable).omit({ id: true, createdAt: true });

export type InsertLoyaltyConfig = z.infer<typeof insertLoyaltyConfigSchema>;
export type LoyaltyConfig = typeof loyaltyConfigTable.$inferSelect;
export type LoyaltyReward = typeof loyaltyRewardsTable.$inferSelect;
export type ClientLoyalty = typeof clientLoyaltyTable.$inferSelect;
export type LoyaltyTransaction = typeof loyaltyTransactionsTable.$inferSelect;
