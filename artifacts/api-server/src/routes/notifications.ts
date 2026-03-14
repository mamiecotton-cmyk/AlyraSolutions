import { Router } from "express";
import { db } from "@workspace/db";
import { notificationTemplatesTable, notificationLogsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router = Router();

router.post("/salons/:salonId/notifications/send", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { recipientPhone, message, type, appointmentId, waitlistEntryId } = req.body;

    await db.insert(notificationLogsTable).values({
      salonId,
      recipientPhone,
      message,
      type,
      status: "logged",
      appointmentId: appointmentId || null,
      waitlistEntryId: waitlistEntryId || null,
    });

    res.json({
      success: true,
      messageId: null,
      message: "Notification logged (Twilio integration required for actual SMS delivery)",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to send notification" });
  }
});

router.get("/salons/:salonId/notifications/templates", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const templates = await db.select().from(notificationTemplatesTable)
      .where(eq(notificationTemplatesTable.salonId, salonId));
    res.json({ data: templates });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list templates" });
  }
});

router.post("/salons/:salonId/notifications/templates", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { name, type, template } = req.body;

    const [tmpl] = await db.insert(notificationTemplatesTable).values({
      salonId,
      name,
      type,
      template,
    }).returning();

    res.status(201).json(tmpl);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create template" });
  }
});

export default router;
