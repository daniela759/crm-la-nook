/**
 * Auth pentru CRM Nook — partea care rulează ÎN EDGE (proxy.ts).
 * Doar Web Crypto API; nu importă bcrypt sau Prisma.
 *
 * Pentru hash parole + lookup user în DB, vezi src/lib/auth-server.ts
 * (rulează doar în Node — Server Actions și Server Components).
 */

const SESSION_COOKIE = "nook_session";
const MAX_AGE_DAYS = 30;
const MAX_AGE_MS = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET nu este setat");
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

/** Cookie format: `userId.timestamp.hmac` */
export async function createSessionToken(userId: string): Promise<string> {
  const ts = Date.now().toString();
  const payload = `${userId}.${ts}`;
  const sig = await hmacHex(payload, getSecret());
  return `${payload}.${sig}`;
}

/** Verifică un token. Întoarce userId sau null. */
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
  maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
};
