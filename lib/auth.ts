import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "./db";

export const SESSION_COOKIE_NAME = "rehearsal_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

export const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().trim().email("Please provide a valid email address").max(100),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
  workspace: z.string().trim().max(60).optional(),
});

export const LoginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  workspace: string;
  createdAt: Date;
};

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(computedHash, "hex"),
    );
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await db.authSession.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
  return token;
}

export async function validateSession(token: string): Promise<SafeUser | null> {
  if (!token) return null;
  try {
    const session = await db.authSession.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await db.authSession.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      workspace: session.user.workspace,
      createdAt: session.user.createdAt,
    };
  } catch (err) {
    console.error("Session validation error:", err);
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  if (!token) return;
  try {
    await db.authSession.deleteMany({
      where: { token },
    });
  } catch (err) {
    console.error("Session deletion error:", err);
  }
}

export async function getCurrentUser(req: NextRequest): Promise<SafeUser | null> {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  return validateSession(cookie);
}
