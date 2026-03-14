import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  salonId: number | null;
}

const sessions = new Map<string, AuthUser>();

export function createSession(user: AuthUser): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, user);
  return token;
}

export function getSession(token: string): AuthUser | undefined {
  return sessions.get(token);
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "alyra_salt").digest("hex");
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    return;
  }
  const token = authHeader.slice(7);
  const user = getSession(token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    return;
  }
  (req as any).user = user;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as AuthUser;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
