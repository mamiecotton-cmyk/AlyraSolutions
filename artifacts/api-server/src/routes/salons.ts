import { Router } from "express";
import { db } from "@workspace/db";
import { salonsTable, usersTable, appointmentsTable, waitlistTable, techniciansTable } from "@workspace/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPaginationParams, paginate } from "../lib/pagination.js";

const router = Router();

const DEFAULT_OPENING_HOURS = {
  monday: { open: true, openTime: "09:00", closeTime: "19:00" },
  tuesday: { open: true, openTime: "09:00", closeTime: "19:00" },
  wednesday: { open: true, openTime: "09:00", closeTime: "19:00" },
  thursday: { open: true, openTime: "09:00", closeTime: "19:00" },
  friday: { open: true, openTime: "09:00", closeTime: "19:00" },
  saturday: { open: true, openTime: "10:00", closeTime: "17:00" },
  sunday: { open: false, openTime: null, closeTime: null },
};

function formatSalon(salon: any) {
  return {
    ...salon,
    openingHours: salon.openingHours || DEFAULT_OPENING_HOURS,
  };
}

router.get("/salons", requireAuth, async (req, res) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const [salons, totalResult] = await Promise.all([
      db.select().from(salonsTable).limit(limit).offset(offset),
      db.select({ count: count() }).from(salonsTable),
    ]);

    res.json(paginate(salons.map(formatSalon), totalResult[0].count, pagination));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list salons" });
  }
});

router.post("/salons", requireAuth, async (req, res) => {
  try {
    const { name, subdomain, description, address, city, state, zipCode, phone, email, website, timezone, ownerId } = req.body;

    const [salon] = await db.insert(salonsTable).values({
      name,
      subdomain,
      description,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      timezone: timezone || "America/New_York",
      ownerId,
      openingHours: DEFAULT_OPENING_HOURS,
    }).returning();

    res.status(201).json(formatSalon(salon));
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Conflict", message: "Subdomain already taken" });
      return;
    }
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create salon" });
  }
});

router.get("/salons/by-subdomain/:subdomain", async (req, res) => {
  try {
    const salons = await db.select().from(salonsTable).where(eq(salonsTable.subdomain, req.params.subdomain));
    if (!salons[0]) {
      res.status(404).json({ error: "Not Found", message: "Salon not found" });
      return;
    }
    res.json(formatSalon(salons[0]));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get salon" });
  }
});

router.get("/salons/:salonId", async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const salons = await db.select().from(salonsTable).where(eq(salonsTable.id, salonId));
    if (!salons[0]) {
      res.status(404).json({ error: "Not Found", message: "Salon not found" });
      return;
    }
    res.json(formatSalon(salons[0]));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get salon" });
  }
});

router.put("/salons/:salonId", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const updates: any = {};
    const allowed = ["name", "description", "address", "city", "state", "zipCode", "phone", "email", "website", "timezone", "status", "openingHours"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();

    const [updated] = await db.update(salonsTable).set(updates).where(eq(salonsTable.id, salonId)).returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found", message: "Salon not found" });
      return;
    }
    res.json(formatSalon(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update salon" });
  }
});

router.delete("/salons/:salonId", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    await db.delete(salonsTable).where(eq(salonsTable.id, salonId));
    res.json({ message: "Salon deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete salon" });
  }
});

router.get("/salons/:salonId/stats", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalAppts,
      todayAppts,
      pendingAppts,
      totalClients,
      totalTechs,
      waitlistCount,
    ] = await Promise.all([
      db.select({ count: count() }).from(appointmentsTable).where(eq(appointmentsTable.salonId, salonId)),
      db.select({ count: count() }).from(appointmentsTable).where(
        and(
          eq(appointmentsTable.salonId, salonId),
          sql`scheduled_at >= ${today} AND scheduled_at < ${tomorrow}`
        )
      ),
      db.select({ count: count() }).from(appointmentsTable).where(
        and(eq(appointmentsTable.salonId, salonId), eq(appointmentsTable.status, "pending"))
      ),
      db.select({ count: count() }).from(usersTable).where(
        and(eq(usersTable.salonId, salonId), eq(usersTable.role, "client"))
      ),
      db.select({ count: count() }).from(techniciansTable).where(
        and(eq(techniciansTable.salonId, salonId), eq(techniciansTable.isActive, true))
      ),
      db.select({ count: count() }).from(waitlistTable).where(
        and(eq(waitlistTable.salonId, salonId), eq(waitlistTable.status, "waiting"))
      ),
    ]);

    res.json({
      totalAppointments: totalAppts[0].count,
      todayAppointments: todayAppts[0].count,
      pendingAppointments: pendingAppts[0].count,
      totalClients: totalClients[0].count,
      totalTechnicians: totalTechs[0].count,
      currentWaitlistCount: waitlistCount[0].count,
      avgWaitTime: 15,
      monthlyRevenue: 0,
      totalRevenue: 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get stats" });
  }
});

router.get("/admin/salons", requireAuth, async (req, res) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const [salons, totalResult] = await Promise.all([
      db.select().from(salonsTable).limit(limit).offset(offset),
      db.select({ count: count() }).from(salonsTable),
    ]);

    res.json(paginate(salons.map(formatSalon), totalResult[0].count, pagination));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list salons" });
  }
});

router.get("/admin/stats", requireAuth, async (req, res) => {
  try {
    const [salonCount, activeSalons, userCount, apptCount] = await Promise.all([
      db.select({ count: count() }).from(salonsTable),
      db.select({ count: count() }).from(salonsTable).where(eq(salonsTable.status, "active")),
      db.select({ count: count() }).from(usersTable),
      db.select({ count: count() }).from(appointmentsTable),
    ]);

    res.json({
      totalSalons: salonCount[0].count,
      activeSalons: activeSalons[0].count,
      totalUsers: userCount[0].count,
      totalAppointments: apptCount[0].count,
      platformRevenue: 0,
      monthlyGrowth: 12.5,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get platform stats" });
  }
});

export default router;
