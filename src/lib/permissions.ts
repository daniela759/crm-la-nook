/**
 * Permisiuni pe rol pentru Nook CRM — sursa unică de adevăr.
 *
 * 3 roluri (vezi domain.ts):
 *  - SUPER_ADMIN  — Ela & Flaviu (+ contul Franc Agency). Vede și editează tot.
 *  - MARKETING    — agenția. Vede tot, dar DOAR citește (nu modifică nimic).
 *  - OPERATIONAL  — personalul. Taskuri operaționale, rezervări, calendar, contacte.
 *                   Fără financiar, abonamente, setări sau utilizatori.
 *
 * Regulă de aur: ascunderea butoanelor în UI e doar cosmetică. Orice acțiune
 * care modifică date trebuie protejată ȘI pe server (requireEditor / requireSuperAdmin).
 */
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { TASK_CATEGORIES, type TaskCategory, type UserRole } from "@/lib/domain";

export type AppSection =
  | "dashboard"
  | "taskuri"
  | "rezervari"
  | "calendar"
  | "contacte"
  | "abonamente"
  | "incasari"
  | "financiar"
  | "setari"
  | "utilizatori";

const ALL_ROLES: UserRole[] = ["SUPER_ADMIN", "MARKETING", "OPERATIONAL"];

/** Ce roluri pot DESCHIDE fiecare secțiune. */
const SECTION_ROLES: Record<AppSection, UserRole[]> = {
  dashboard: ALL_ROLES,
  taskuri: ALL_ROLES,
  rezervari: ALL_ROLES,
  calendar: ALL_ROLES,
  contacte: ALL_ROLES,
  abonamente: ["SUPER_ADMIN", "MARKETING"],
  incasari: ["SUPER_ADMIN", "MARKETING"],
  financiar: ["SUPER_ADMIN", "MARKETING"],
  setari: ["SUPER_ADMIN"],
  utilizatori: ["SUPER_ADMIN"],
};

function asRole(role: string | null | undefined): UserRole | null {
  return role && (ALL_ROLES as string[]).includes(role) ? (role as UserRole) : null;
}

export function canAccess(role: string | null | undefined, section: AppSection): boolean {
  const r = asRole(role);
  return r ? SECTION_ROLES[section].includes(r) : false;
}

/** Poate crea / edita date. Marketing = doar citește. */
export function canEdit(role: string | null | undefined): boolean {
  const r = asRole(role);
  return r === "SUPER_ADMIN" || r === "OPERATIONAL";
}

/** Acțiuni rezervate super-adminului: utilizatori, setări, ștergeri, vânzare abonamente. */
export function isSuperAdmin(role: string | null | undefined): boolean {
  return asRole(role) === "SUPER_ADMIN";
}

/**
 * Poate gestiona taskuri (adăugare manuală + schimbare status/deadline).
 * TOATE rolurile pot — marketing și super-admin pe orice categorie, operational
 * doar pe categoria operațională (restricția se aplică în addManualTask).
 */
export function canManageTasks(role: string | null | undefined): boolean {
  return asRole(role) !== null;
}

/** Categoriile de taskuri vizibile pentru un rol. */
export function visibleTaskCategories(role: string | null | undefined): TaskCategory[] {
  const r = asRole(role);
  if (r === "OPERATIONAL") return ["OPERATIONAL"];
  return [...TASK_CATEGORIES]; // super-admin + marketing văd toate
}

// ─── Guard-uri server (de folosit în pagini și Server Actions) ──────────────

/** Cere user logat; altfel redirect la /login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Cere acces la o secțiune; dacă rolul nu are voie, redirect la /dashboard. */
export async function requireSection(section: AppSection) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccess(user.role, section)) redirect("/dashboard");
  return user;
}

/** Variantă de pagină: cere drept de editare, altfel redirect (nu aruncă eroare). */
export async function requireEditorPage(redirectTo = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canEdit(user.role)) redirect(redirectTo);
  return user;
}

/** Variantă de pagină: cere super-admin, altfel redirect (nu aruncă eroare). */
export async function requireSuperAdminPage(redirectTo = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperAdmin(user.role)) redirect(redirectTo);
  return user;
}

/** Cere drept de editare; aruncă dacă e cont doar-citire (marketing). Pentru Server Actions. */
export async function requireEditor() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canEdit(user.role)) {
    throw new Error("Cont doar-citire: nu ai permisiunea să modifici date.");
  }
  return user;
}

/** Cere drept de gestionare taskuri (orice rol logat); aruncă altfel. Pentru Server Actions. */
export async function requireTaskManager() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canManageTasks(user.role)) {
    throw new Error("Nu ai permisiunea să gestionezi taskuri.");
  }
  return user;
}

/** Cere rol de super-admin; aruncă altfel. */
export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isSuperAdmin(user.role)) {
    throw new Error("Doar super-adminii pot face această acțiune.");
  }
  return user;
}
