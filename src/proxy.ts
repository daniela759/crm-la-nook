import { NextResponse, type NextRequest } from "next/server";
import { SESSION_CONFIG, verifySessionToken } from "@/lib/auth";

/**
 * Protejează zona de aplicație (orice e în (app)/* + paginile principale).
 * Lasă liber: `/login`, `/`, asset-urile, API-urile publice.
 */
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (/\.(png|jpe?g|svg|gif|webp|ico|css|js|woff2?)$/.test(pathname)) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get(SESSION_CONFIG.name)?.value;
  const valid = await verifySessionToken(token);
  if (valid) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Rulează pe toate rutele în afară de asset-urile statice
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
