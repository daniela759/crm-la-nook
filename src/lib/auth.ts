/**
 * Auth minimal pentru single-admin CRM.
 * - Parolă în .env (`ADMIN_USERNAME` + `ADMIN_PASSWORD`)
 * - Cookie de sesiune semnat cu HMAC-SHA256 + timestamp (expirare 30 zile)
 * - Funcționează în Edge runtime (Web Crypto API), deci compatibil cu middleware
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

/** Creează un token de sesiune semnat. */
export async function createSessionToken(): Promise<string> {
  const ts = Date.now().toString();
  const sig = await hmacHex(ts, getSecret());
  return `${ts}.${sig}`;
}

/** Verifică un token de sesiune. Returnează true dacă e valid și neexpirat. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const idx = token.indexOf(".");
  if (idx < 1) return false;
  const ts = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  const expected = await hmacHex(ts, getSecret());
  if (sig !== expected) return false;

  const age = Date.now() - Number(ts);
  if (Number.isNaN(age) || age < 0 || age > MAX_AGE_MS) return false;

  return true;
}

/** Verifică credențialele față de cele din .env. */
export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME ?? "admin";
  const p = process.env.ADMIN_PASSWORD ?? "";
  if (!p) return false;
  // Comparație constant-time pentru parolă
  if (username !== u) return false;
  if (password.length !== p.length) return false;
  let mismatch = 0;
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ p.charCodeAt(i);
  }
  return mismatch === 0;
}

export const SESSION_CONFIG = {
  name: SESSION_COOKIE,
  maxAge: MAX_AGE_DAYS * 24 * 60 * 60, // în secunde
};
