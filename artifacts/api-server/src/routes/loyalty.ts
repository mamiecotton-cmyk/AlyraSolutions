import { Router } from "express";
import { db } from "@workspace/db";
import {
  loyaltyConfigTable,
  loyaltyRewardsTable,
  clientLoyaltyTable,
  loyaltyTransactionsTable,
} from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

const DEFAULT_TIER_CONFIG = [
  { name: "Bronze", minPoints: 0, benefits: ["5% birthday discount"], color: "#CD7F32" },
  { name: "Silver", minPoints: 500, benefits: ["10% discount", "Priority booking"], color: "#C0C0C0" },
  { name: "Gold", minPoints: 1000, benefits: ["15% discount", "Priority booking", "Free nail art"], color: "#FFD700" },
  { name: "Platinum", minPoints: 2500, benefits: ["20% discount", "VIP service", "Free monthly service"], color: "#E5E4E2" },
];

function getTier(points: number, tiers: any[]): string {
  const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
  return sorted.find((t) => points >= t.minPoints)?.name || "Bronze";
}

router.get("/salons/:salonId/loyalty/config", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    let configs = await db.select().from(loyaltyConfigTable).where(eq(loyaltyConfigTable.salonId, salonId));

    if (!configs[0]) {
      const [config] = await db.insert(loyaltyConfigTable).values({
        salonId,
        isEnabled: true,
        pointsPerDollar: "1",
        pointsPerVisit: 10,
        minimumRedemption: 100,
        tierConfig: DEFAULT_TIER_CONFIG,
      }).returning();
      configs = [config];
    }

    const c = configs[0];
    res.json({
      ...c,
      pointsPerDollar: parseFloat(String(c.pointsPerDollar)),
      tierConfig: c.tierConfig || DEFAULT_TIER_CONFIG,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get loyalty config" });
  }
});

router.put("/salons/:salonId/loyalty/config", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { isEnabled, pointsPerDollar, pointsPerVisit, minimumRedemption, pointsExpireDays, tierConfig } = req.body;

    const updates: any = { updatedAt: new Date() };
    if (isEnabled !== undefined) updates.isEnabled = isEnabled;
    if (pointsPerDollar !== undefined) updates.pointsPerDollar = String(pointsPerDollar);
    if (pointsPerVisit !== undefined) updates.pointsPerVisit = pointsPerVisit;
    if (minimumRedemption !== undefined) updates.minimumRedemption = minimumRedemption;
    if (pointsExpireDays !== undefined) updates.pointsExpireDays = pointsExpireDays;
    if (tierConfig !== undefined) updates.tierConfig = tierConfig;

    let existing = await db.select().from(loyaltyConfigTable).where(eq(loyaltyConfigTable.salonId, salonId));
    if (!existing[0]) {
      const [created] = await db.insert(loyaltyConfigTable).values({
        salonId, ...updates, pointsPerDollar: updates.pointsPerDollar || "1", pointsPerVisit: updates.pointsPerVisit || 10, minimumRedemption: updates.minimumRedemption || 100, tierConfig: updates.tierConfig || DEFAULT_TIER_CONFIG,
      }).returning();
      res.json({ ...created, pointsPerDollar: parseFloat(String(created.pointsPerDollar)), tierConfig: created.tierConfig || DEFAULT_TIER_CONFIG });
      return;
    }

    const [updated] = await db.update(loyaltyConfigTable).set(updates).where(eq(loyaltyConfigTable.salonId, salonId)).returning();
    res.json({ ...updated, pointsPerDollar: parseFloat(String(updated.pointsPerDollar)), tierConfig: updated.tierConfig || DEFAULT_TIER_CONFIG });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update loyalty config" });
  }
});

router.get("/salons/:salonId/loyalty/rewards", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const rewards = await db.select().from(loyaltyRewardsTable)
      .where(and(eq(loyaltyRewardsTable.salonId, salonId), eq(loyaltyRewardsTable.isActive, true)));

    res.json({ data: rewards.map((r) => ({ ...r, discountValue: r.discountValue ? parseFloat(String(r.discountValue)) : null })) });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list rewards" });
  }
});

router.post("/salons/:salonId/loyalty/rewards", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { name, description, pointsCost, discountType, discountValue, serviceId } = req.body;

    const [reward] = await db.insert(loyaltyRewardsTable).values({
      salonId,
      name,
      description,
      pointsCost,
      discountType,
      discountValue: discountValue ? String(discountValue) : null,
      serviceId: serviceId || null,
    }).returning();

    res.status(201).json({ ...reward, discountValue: reward.discountValue ? parseFloat(String(reward.discountValue)) : null });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create reward" });
  }
});

router.get("/salons/:salonId/loyalty/clients/:clientId", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const clientId = parseInt(req.params.clientId);

    let loyalty = await db.select().from(clientLoyaltyTable)
      .where(and(eq(clientLoyaltyTable.clientId, clientId), eq(clientLoyaltyTable.salonId, salonId)));

    if (!loyalty[0]) {
      const [created] = await db.insert(clientLoyaltyTable).values({
        clientId, salonId, totalPoints: 0, lifetimePoints: 0, visitCount: 0, totalSpent: "0",
      }).returning();
      loyalty = [created];
    }

    const transactions = await db.select().from(loyaltyTransactionsTable)
      .where(and(eq(loyaltyTransactionsTable.clientId, clientId), eq(loyaltyTransactionsTable.salonId, salonId)));

    const config = await db.select().from(loyaltyConfigTable).where(eq(loyaltyConfigTable.salonId, salonId));
    const tiers = (config[0]?.tierConfig as any[]) || DEFAULT_TIER_CONFIG;

    const l = loyalty[0];
    res.json({
      clientId,
      salonId,
      totalPoints: l.totalPoints,
      lifetimePoints: l.lifetimePoints,
      tier: getTier(l.lifetimePoints, tiers),
      visitCount: l.visitCount,
      totalSpent: parseFloat(String(l.totalSpent)),
      transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get client loyalty" });
  }
});

router.post("/salons/:salonId/loyalty/clients/:clientId/redeem", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const clientId = parseInt(req.params.clientId);
    const { rewardId, appointmentId } = req.body;

    const rewards = await db.select().from(loyaltyRewardsTable).where(eq(loyaltyRewardsTable.id, rewardId));
    const reward = rewards[0];
    if (!reward) {
      res.status(404).json({ error: "Not Found", message: "Reward not found" });
      return;
    }

    const loyalties = await db.select().from(clientLoyaltyTable)
      .where(and(eq(clientLoyaltyTable.clientId, clientId), eq(clientLoyaltyTable.salonId, salonId)));

    if (!loyalties[0] || loyalties[0].totalPoints < reward.pointsCost) {
      res.status(400).json({ error: "Bad Request", message: "Insufficient points" });
      return;
    }

    const [updated] = await db.update(clientLoyaltyTable)
      .set({ totalPoints: loyalties[0].totalPoints - reward.pointsCost, updatedAt: new Date() })
      .where(and(eq(clientLoyaltyTable.clientId, clientId), eq(clientLoyaltyTable.salonId, salonId)))
      .returning();

    await db.insert(loyaltyTransactionsTable).values({
      clientId,
      salonId,
      points: -reward.pointsCost,
      type: "redeemed",
      description: `Redeemed: ${reward.name}`,
      appointmentId: appointmentId || null,
    });

    const config = await db.select().from(loyaltyConfigTable).where(eq(loyaltyConfigTable.salonId, salonId));
    const tiers = (config[0]?.tierConfig as any[]) || DEFAULT_TIER_CONFIG;

    res.json({
      clientId,
      salonId,
      totalPoints: updated.totalPoints,
      lifetimePoints: updated.lifetimePoints,
      tier: getTier(updated.lifetimePoints, tiers),
      visitCount: updated.visitCount,
      totalSpent: parseFloat(String(updated.totalSpent)),
      transactions: [],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to redeem points" });
  }
});

export default router;
