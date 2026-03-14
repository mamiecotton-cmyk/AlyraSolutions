import { Router } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPaginationParams, paginate } from "../lib/pagination.js";

const router = Router();

function formatService(service: any) {
  return {
    ...service,
    price: parseFloat(service.price),
  };
}

router.get("/salons/:salonId/services", async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const pagination = getPaginationParams(req.query);
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(servicesTable.salonId, salonId), eq(servicesTable.isActive, true)];
    const where = and(...conditions);

    const [services, totalResult] = await Promise.all([
      db.select().from(servicesTable).where(where).limit(limit).offset(offset),
      db.select({ count: count() }).from(servicesTable).where(where),
    ]);

    res.json(paginate(services.map(formatService), totalResult[0].count, pagination));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list services" });
  }
});

router.post("/salons/:salonId/services", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { name, description, category, duration, price } = req.body;

    const [service] = await db.insert(servicesTable).values({
      salonId,
      name,
      description,
      category,
      duration,
      price: String(price),
    }).returning();

    res.status(201).json(formatService(service));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create service" });
  }
});

router.get("/salons/:salonId/services/:serviceId", async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const services = await db.select().from(servicesTable).where(eq(servicesTable.id, serviceId));
    if (!services[0]) {
      res.status(404).json({ error: "Not Found", message: "Service not found" });
      return;
    }
    res.json(formatService(services[0]));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get service" });
  }
});

router.put("/salons/:salonId/services/:serviceId", requireAuth, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const updates: any = {};
    const allowed = ["name", "description", "category", "duration", "price", "isActive"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = key === "price" ? String(req.body[key]) : req.body[key];
    }
    updates.updatedAt = new Date();

    const [updated] = await db.update(servicesTable).set(updates).where(eq(servicesTable.id, serviceId)).returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found", message: "Service not found" });
      return;
    }
    res.json(formatService(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update service" });
  }
});

router.delete("/salons/:salonId/services/:serviceId", requireAuth, async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    await db.update(servicesTable).set({ isActive: false }).where(eq(servicesTable.id, serviceId));
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete service" });
  }
});

export default router;
