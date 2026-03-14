import { Router } from "express";
import { db } from "@workspace/db";
import { waitlistTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import crypto from "crypto";

const router = Router();

function formatEntry(entry: any) {
  return {
    ...entry,
    serviceIds: entry.serviceIds || [],
  };
}

async function recalculatePositions(salonId: number) {
  const entries = await db.select().from(waitlistTable)
    .where(and(eq(waitlistTable.salonId, salonId), eq(waitlistTable.status, "waiting")));

  for (let i = 0; i < entries.length; i++) {
    const estimatedWait = i * 15;
    await db.update(waitlistTable)
      .set({ position: i + 1, estimatedWaitMinutes: estimatedWait })
      .where(eq(waitlistTable.id, entries[i].id));
  }
}

router.get("/salons/:salonId/waitlist", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const conditions: any[] = [eq(waitlistTable.salonId, salonId)];

    if (req.query.status) {
      conditions.push(eq(waitlistTable.status, req.query.status as any));
    } else {
      conditions.push(eq(waitlistTable.status, "waiting"));
    }

    const entries = await db.select().from(waitlistTable)
      .where(and(...conditions))
      .orderBy(waitlistTable.position);

    const totalWaiting = entries.filter((e) => e.status === "waiting").length;
    const avgWaitTime = totalWaiting * 15;

    res.json({
      entries: entries.map(formatEntry),
      totalWaiting,
      avgWaitTime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get waitlist" });
  }
});

router.post("/salons/:salonId/waitlist", async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { clientName, clientPhone, partySize, serviceIds, preferredTechnicianId, notes, clientId } = req.body;

    const waiting = await db.select({ count: count() }).from(waitlistTable)
      .where(and(eq(waitlistTable.salonId, salonId), eq(waitlistTable.status, "waiting")));

    const position = (waiting[0].count) + 1;
    const estimatedWait = (position - 1) * 15;
    const checkInCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    const [entry] = await db.insert(waitlistTable).values({
      salonId,
      clientId: clientId || null,
      clientName,
      clientPhone: clientPhone || null,
      partySize: partySize || 1,
      serviceIds: serviceIds || [],
      preferredTechnicianId: preferredTechnicianId || null,
      status: "waiting",
      position,
      estimatedWaitMinutes: estimatedWait,
      notes: notes || null,
      checkInCode,
    }).returning();

    res.status(201).json(formatEntry(entry));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to join waitlist" });
  }
});

router.get("/salons/:salonId/waitlist/qr-code", async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
      : "http://localhost:80";

    const checkInUrl = `${baseUrl}/walkin?salon=${salonId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInUrl)}`;

    res.json({ qrCodeUrl, checkInUrl, salonId });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get QR code" });
  }
});

router.get("/salons/:salonId/waitlist/wait-time", async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);

    const waiting = await db.select({ count: count() }).from(waitlistTable)
      .where(and(eq(waitlistTable.salonId, salonId), eq(waitlistTable.status, "waiting")));

    const queueLength = waiting[0].count;

    res.json({
      estimatedMinutes: queueLength * 15,
      currentQueueLength: queueLength,
      availableTechnicians: 3,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get wait time" });
  }
});

router.get("/salons/:salonId/waitlist/:entryId", async (req, res) => {
  try {
    const entryId = parseInt(req.params.entryId);
    const entries = await db.select().from(waitlistTable).where(eq(waitlistTable.id, entryId));
    if (!entries[0]) {
      res.status(404).json({ error: "Not Found", message: "Waitlist entry not found" });
      return;
    }
    res.json(formatEntry(entries[0]));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get entry" });
  }
});

router.put("/salons/:salonId/waitlist/:entryId", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const entryId = parseInt(req.params.entryId);
    const { status, preferredTechnicianId } = req.body;

    const updates: any = {};
    if (status) updates.status = status;
    if (preferredTechnicianId !== undefined) updates.preferredTechnicianId = preferredTechnicianId;
    if (status === "called") updates.calledAt = new Date();
    if (status === "completed" || status === "left") updates.completedAt = new Date();

    const [updated] = await db.update(waitlistTable).set(updates).where(eq(waitlistTable.id, entryId)).returning();

    if (status === "completed" || status === "left" || status === "serving") {
      await recalculatePositions(salonId);
    }

    res.json(formatEntry(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update entry" });
  }
});

export default router;
