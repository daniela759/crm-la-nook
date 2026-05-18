/**
 * Auth pentru CRM Nook — partea Node-only (Server Actions + RSC).
 * Folosește bcryptjs + Prisma. NU importa de aici în proxy.ts (Edge).
 */
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { SESSION_CONFIG, verifySessionToken } from "@/lib/auth";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Întoarce user-ul curent (din cookie + DB) sau null. */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_CONFIG.name)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, active: true, role: true },
  });
  if (!user || !user.active) return null;
  return user;
}

/** Throws dacă userul curent nu e admin. De folosit în pagini/Server Actions admin-only. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("Doar administratorii pot accesa această pagină.");
  }
  return user;
}

export function isAdmin(user: { role?: string | null } | null): boolean {
  return user?.role === "ADMIN";
}
