import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, appointmentsTable, clientLoyaltyTable } from "@workspace/db/schema";
import { eq, and, count, ilike } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPaginationParams, paginate } from "../lib/pagination.js";

const router = Router();

router.get("/salons/:salonId/clients", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const pagination = getPaginationParams(req.query);
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [
      eq(usersTable.salonId, salonId),
      eq(usersTable.role, "client"),
    ];

    const where = and(...conditions);

    const [users, totalResult] = await Promise.all([
      db.select().from(usersTable).where(where).limit(limit).offset(offset),
      db.select({ count: count() }).from(usersTable).where(where),
    ]);

    const profiles = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      birthday: null,
      allergies: null,
      preferences: null,
      preferredTechnicianId: null,
      totalVisits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      loyaltyTier: "Bronze",
      lastVisitAt: null,
      recentAppointments: [],
      favoritedColors: [],
      createdAt: u.createdAt,
    }));

    res.json(paginate(profiles, totalResult[0].count, pagination));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list clients" });
  }
});

router.get("/salons/:salonId/clients/:clientId", requireAuth, async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const salonId = parseInt(req.params.salonId);

    const users = await db.select().from(usersTable).where(eq(usersTable.id, clientId));
    const user = users[0];
    if (!user) {
      res.status(404).json({ error: "Not Found", message: "Client not found" });
      return;
    }

    const [appts, loyalty] = await Promise.all([
      db.select().from(appointmentsTable)
        .where(and(eq(appointmentsTable.clientId, clientId), eq(appointmentsTable.salonId, salonId)))
        .limit(5),
      db.select().from(clientLoyaltyTable)
        .where(and(eq(clientLoyaltyTable.clientId, clientId), eq(clientLoyaltyTable.salonId, salonId))),
    ]);

    const loyaltyData = loyalty[0];

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      birthday: null,
      allergies: null,
      preferences: null,
      preferredTechnicianId: null,
      totalVisits: loyaltyData?.visitCount || 0,
      totalSpent: loyaltyData ? parseFloat(String(loyaltyData.totalSpent)) : 0,
      loyaltyPoints: loyaltyData?.totalPoints || 0,
      loyaltyTier: "Bronze",
      lastVisitAt: appts[0]?.scheduledAt || null,
      recentAppointments: appts.map((a) => ({
        ...a,
        clientName: `${user.firstName} ${user.lastName}`,
        clientPhone: user.phone,
        technicians: [],
        services: [],
        totalAmount: a.totalAmount ? parseFloat(String(a.totalAmount)) : null,
      })),
      favoritedColors: [],
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get client profile" });
  }
});

router.put("/salons/:salonId/clients/:clientId", requireAuth, async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId);
    const { phone, preferredTechnicianId } = req.body;

    const updates: any = { updatedAt: new Date() };
    if (phone !== undefined) updates.phone = phone;

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, clientId)).returning();

    res.json({
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      birthday: null,
      allergies: null,
      preferences: null,
      preferredTechnicianId: null,
      totalVisits: 0,
      totalSpent: 0,
      loyaltyPoints: 0,
      loyaltyTier: "Bronze",
      lastVisitAt: null,
      recentAppointments: [],
      favoritedColors: [],
      createdAt: updated.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update client" });
  }
});

export default router;
