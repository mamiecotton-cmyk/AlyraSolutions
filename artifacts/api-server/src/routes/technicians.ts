import { Router } from "express";
import { db } from "@workspace/db";
import { techniciansTable, usersTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPaginationParams, paginate } from "../lib/pagination.js";

const router = Router();

async function formatTechnician(tech: any) {
  const users = await db.select().from(usersTable).where(eq(usersTable.id, tech.userId));
  const user = users[0];
  return {
    id: tech.id,
    userId: tech.userId,
    salonId: tech.salonId,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || null,
    specialties: tech.specialties || [],
    bio: tech.bio,
    avatarUrl: tech.avatarUrl || user?.avatarUrl,
    isActive: tech.isActive,
    isAvailable: tech.isAvailable,
    rating: tech.rating ? parseFloat(tech.rating) : null,
    totalReviews: tech.totalReviews,
    createdAt: tech.createdAt,
  };
}

router.get("/salons/:salonId/technicians", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const pagination = getPaginationParams(req.query);
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(techniciansTable.salonId, salonId)];
    if (req.query.available === "true") {
      conditions.push(eq(techniciansTable.isAvailable, true));
    }

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [techs, totalResult] = await Promise.all([
      db.select().from(techniciansTable).where(where).limit(limit).offset(offset),
      db.select({ count: count() }).from(techniciansTable).where(where),
    ]);

    const formatted = await Promise.all(techs.map(formatTechnician));
    res.json(paginate(formatted, totalResult[0].count, pagination));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list technicians" });
  }
});

router.post("/salons/:salonId/technicians", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { userId, specialties, bio } = req.body;

    const [tech] = await db.insert(techniciansTable).values({
      userId,
      salonId,
      specialties: specialties || [],
      bio: bio || null,
    }).returning();

    const formatted = await formatTechnician(tech);
    res.status(201).json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create technician" });
  }
});

router.get("/salons/:salonId/technicians/:technicianId", requireAuth, async (req, res) => {
  try {
    const techId = parseInt(req.params.technicianId);
    const techs = await db.select().from(techniciansTable).where(eq(techniciansTable.id, techId));
    if (!techs[0]) {
      res.status(404).json({ error: "Not Found", message: "Technician not found" });
      return;
    }
    const formatted = await formatTechnician(techs[0]);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get technician" });
  }
});

router.put("/salons/:salonId/technicians/:technicianId", requireAuth, async (req, res) => {
  try {
    const techId = parseInt(req.params.technicianId);
    const updates: any = {};
    const allowed = ["specialties", "bio", "isActive", "isAvailable"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();

    const [updated] = await db.update(techniciansTable).set(updates).where(eq(techniciansTable.id, techId)).returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found", message: "Technician not found" });
      return;
    }
    const formatted = await formatTechnician(updated);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update technician" });
  }
});

router.get("/salons/:salonId/technicians/:technicianId/schedule", requireAuth, async (req, res) => {
  try {
    const techId = parseInt(req.params.technicianId);
    const date = req.query.date as string;

    res.json({
      technicianId: techId,
      date,
      workHours: { open: true, openTime: "09:00", closeTime: "19:00" },
      appointments: [],
      blockedSlots: [],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get schedule" });
  }
});

export default router;
