/**
 * Auth pentru CRM Nook — multi-user, stocați în tabela User.
 *
 * Cookie de sesiune: `<userId>.<timestamp>.<hmacSha256>` cu expirare 30 zile.
 * - createSessionToken / verifySessionToken: rulează în Edge (Web Crypto).
 * - hashPassword / verifyPassword: bcryptjs, rulează doar în Node (Server Actions).
 * - getCurrentUser: citește cookie + face lookup în DB; pentru Server Components.
 */

const SESSION_COOKIE = "nook_session";
const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET nu este setat în .env");
  return s;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Creează un token de sesiune semnat pentru un user. */
export async function createSessionToken(userId: string): Promise<string> {
  const ts = Date.now().toString();
  const payload = `${userId}.${ts}`;
  const sig = await hmacHex(payload, getSecret());
  return `${payload}.${sig}`;
}

/** Verifică un token de sesiune. Întoarce userId sau null. */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<string | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  if (!userId || !ts || !sig) return null;

  const expected = await hmacHex(`${userId}.${ts}`, getSecret());
  if (sig !== expected) return null;

  const age = Date.now() - Number(ts);
  if (Number.isNaN(age) || age < 0 || age > MAX_AGE_MS) return null;

  return userId;
}

export const SESSION_CONFIG = {
  name: SESSION_COOKIE,
  maxAge: MAX_AGE_DAYS * 24 * 60 * 60, // în secunde
};

// ─── Funcții care folosesc bcryptjs și DB — DOAR în Node (Server Actions / RSC) ─

/**
 * Hash parolă cu bcrypt (cost 10).
 * Import lazy pentru a evita includerea în Edge bundle.
 */
export async function hashPassword(plain: string): Promise<string> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.compare(plain, hash);
}

/** Returnează user-ul curent (din cookie + DB) sau null. */
export async function getCurrentUser() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) return null;

  const { db } = await import("@/lib/db");
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, active: true },
  });
  if (!user || !user.active) return null;
  return user;
}
