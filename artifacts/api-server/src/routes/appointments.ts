import { Router } from "express";
import { db } from "@workspace/db";
import {
  appointmentsTable,
  appointmentTechniciansTable,
  appointmentServicesTable,
  servicesTable,
  techniciansTable,
  usersTable,
} from "@workspace/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPaginationParams, paginate } from "../lib/pagination.js";

const router = Router();

async function getFullAppointment(apptId: number) {
  const appts = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, apptId));
  if (!appts[0]) return null;
  const appt = appts[0];

  const [clientResult, apptTechs, apptServices] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, appt.clientId)),
    db.select().from(appointmentTechniciansTable).where(eq(appointmentTechniciansTable.appointmentId, apptId)),
    db.select().from(appointmentServicesTable).where(eq(appointmentServicesTable.appointmentId, apptId)),
  ]);

  const client = clientResult[0];

  const technicians = await Promise.all(
    apptTechs.map(async (at) => {
      const techs = await db.select().from(techniciansTable).where(eq(techniciansTable.id, at.technicianId));
      const techUser = techs[0];
      if (!techUser) return null;
      const users = await db.select().from(usersTable).where(eq(usersTable.id, techUser.userId));
      const user = users[0];
      return {
        technicianId: at.technicianId,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        role: at.role,
      };
    })
  );

  const services = await Promise.all(
    apptServices.map(async (as) => {
      const svcs = await db.select().from(servicesTable).where(eq(servicesTable.id, as.serviceId));
      const svc = svcs[0];
      return {
        serviceId: as.serviceId,
        name: svc?.name || "",
        duration: as.duration,
        price: parseFloat(String(as.price)),
        technicianId: as.technicianId,
      };
    })
  );

  return {
    ...appt,
    totalAmount: appt.totalAmount ? parseFloat(String(appt.totalAmount)) : null,
    clientName: client ? `${client.firstName} ${client.lastName}` : "Unknown",
    clientPhone: client?.phone || null,
    technicians: technicians.filter(Boolean),
    services: services.filter(Boolean),
  };
}

router.get("/salons/:salonId/appointments", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const pagination = getPaginationParams(req.query);
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(appointmentsTable.salonId, salonId)];
    if (req.query.status) conditions.push(eq(appointmentsTable.status, req.query.status as any));
    if (req.query.clientId) conditions.push(eq(appointmentsTable.clientId, parseInt(req.query.clientId as string)));

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [appts, totalResult] = await Promise.all([
      db.select().from(appointmentsTable).where(where)
        .orderBy(appointmentsTable.scheduledAt)
        .limit(limit).offset(offset),
      db.select({ count: count() }).from(appointmentsTable).where(where),
    ]);

    const full = await Promise.all(appts.map((a) => getFullAppointment(a.id)));

    res.json(paginate(full.filter(Boolean), totalResult[0].count, pagination));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list appointments" });
  }
});

router.post("/salons/:salonId/appointments", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { clientId, scheduledAt, serviceIds, technicianIds, notes, nailColorId, nailDesignNotes } = req.body;

    const services = await db.select().from(servicesTable)
      .where(sql`id = ANY(ARRAY[${sql.raw(serviceIds.join(","))}]::int[])`);

    const totalDuration = services.reduce((sum: number, s: any) => sum + s.duration, 0);
    const totalAmount = services.reduce((sum: number, s: any) => sum + parseFloat(String(s.price)), 0);
    const startDate = new Date(scheduledAt);
    const endDate = new Date(startDate.getTime() + totalDuration * 60 * 1000);

    const [appt] = await db.insert(appointmentsTable).values({
      salonId,
      clientId,
      scheduledAt: startDate,
      estimatedEndAt: endDate,
      notes: notes || null,
      nailColorId: nailColorId || null,
      nailDesignNotes: nailDesignNotes || null,
      totalAmount: String(totalAmount),
    }).returning();

    await Promise.all([
      ...technicianIds.map((tid: number, idx: number) =>
        db.insert(appointmentTechniciansTable).values({
          appointmentId: appt.id,
          technicianId: tid,
          role: idx === 0 ? "primary" : "assisting",
        })
      ),
      ...services.map((svc: any, idx: number) =>
        db.insert(appointmentServicesTable).values({
          appointmentId: appt.id,
          serviceId: svc.id,
          technicianId: technicianIds[0] || null,
          price: String(svc.price),
          duration: svc.duration,
        })
      ),
    ]);

    const full = await getFullAppointment(appt.id);
    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create appointment" });
  }
});

router.get("/salons/:salonId/appointments/availability", requireAuth, async (req, res) => {
  try {
    const date = req.query.date as string;
    const slots = [];
    for (let hour = 9; hour < 19; hour++) {
      for (const min of [0, 30]) {
        slots.push({
          startTime: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
          endTime: `${String(hour + (min === 30 ? 1 : 0)).padStart(2, "0")}:${min === 30 ? "00" : "30"}`,
          availableTechnicians: [1, 2],
        });
      }
    }
    res.json({ date, slots });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get availability" });
  }
});

router.get("/salons/:salonId/appointments/:appointmentId", requireAuth, async (req, res) => {
  try {
    const apptId = parseInt(req.params.appointmentId);
    const full = await getFullAppointment(apptId);
    if (!full) {
      res.status(404).json({ error: "Not Found", message: "Appointment not found" });
      return;
    }
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get appointment" });
  }
});

router.put("/salons/:salonId/appointments/:appointmentId", requireAuth, async (req, res) => {
  try {
    const apptId = parseInt(req.params.appointmentId);
    const updates: any = {};
    const allowed = ["scheduledAt", "status", "notes", "nailColorId", "nailDesignNotes", "totalAmount"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();

    await db.update(appointmentsTable).set(updates).where(eq(appointmentsTable.id, apptId));
    const full = await getFullAppointment(apptId);
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update appointment" });
  }
});

router.delete("/salons/:salonId/appointments/:appointmentId", requireAuth, async (req, res) => {
  try {
    const apptId = parseInt(req.params.appointmentId);
    const [updated] = await db.update(appointmentsTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(appointmentsTable.id, apptId))
      .returning();

    const full = await getFullAppointment(apptId);
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to cancel appointment" });
  }
});

export default router;
