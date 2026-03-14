import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { createSession, deleteSession, hashPassword, requireAuth, AuthUser } from "../lib/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad Request", message: "Email and password required" });
      return;
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.email, email));
    const user = users[0];

    if (!user || user.passwordHash !== hashPassword(password)) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: "Unauthorized", message: "Account is inactive" });
      return;
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      salonId: user.salonId,
    };

    const token = createSession(authUser);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        salonId: user.salonId,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Login failed" });
  }
});

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, salonId } = req.body;
    if (!email || !password || !firstName || !lastName || !role) {
      res.status(400).json({ error: "Bad Request", message: "Required fields missing" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing.length > 0) {
      res.status(409).json({ error: "Conflict", message: "Email already registered" });
      return;
    }

    const [user] = await db.insert(usersTable).values({
      email,
      passwordHash: hashPassword(password),
      firstName,
      lastName,
      phone: phone || null,
      role,
      salonId: salonId || null,
    }).returning();

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      salonId: user.salonId,
    };

    const token = createSession(authUser);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        salonId: user.salonId,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", message: "Registration failed" });
  }
});

router.post("/auth/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.slice(7);
  if (token) deleteSession(token);
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as AuthUser;
    const users = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
    const dbUser = users[0];
    if (!dbUser) {
      res.status(404).json({ error: "Not Found", message: "User not found" });
      return;
    }
    res.json({
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      phone: dbUser.phone,
      role: dbUser.role,
      salonId: dbUser.salonId,
      avatarUrl: dbUser.avatarUrl,
      isActive: dbUser.isActive,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get user" });
  }
});

export default router;
