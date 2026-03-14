import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { getPaginationParams, paginate } from "../lib/pagination.js";
import { hashPassword } from "../lib/auth.js";

const router = Router();

function formatUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

router.get("/salons/:salonId/users", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const pagination = getPaginationParams(req.query);
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(usersTable.salonId, salonId)];
    if (req.query.role) {
      conditions.push(eq(usersTable.role, req.query.role as any));
    }

    const where = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [users, totalResult] = await Promise.all([
      db.select().from(usersTable).where(where).limit(limit).offset(offset),
      db.select({ count: count() }).from(usersTable).where(where),
    ]);

    res.json(paginate(users.map(formatUser), totalResult[0].count, pagination));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to list users" });
  }
});

router.post("/salons/:salonId/users", requireAuth, async (req, res) => {
  try {
    const salonId = parseInt(req.params.salonId);
    const { email, password, firstName, lastName, phone, role } = req.body;

    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash: hashPassword(password),
      firstName,
      lastName,
      phone: phone || null,
      role,
      salonId,
    }).returning();

    res.status(201).json(formatUser(user));
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Conflict", message: "Email already registered" });
      return;
    }
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create user" });
  }
});

router.get("/salons/:salonId/users/:userId", requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!users[0]) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json(formatUser(users[0]));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get user" });
  }
});

router.put("/salons/:salonId/users/:userId", requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const updates: any = {};
    const allowed = ["firstName", "lastName", "phone", "isActive"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updatedAt = new Date();

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
    if (!updated) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json(formatUser(updated));
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update user" });
  }
});

router.delete("/salons/:salonId/users/:userId", requireAuth, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ message: "User removed successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete user" });
  }
});

export default router;
