import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { logoutAction } from "@/app/login/actions";
import { getCurrentUser } from "@/lib/auth-server";
import { canAccess } from "@/lib/permissions";
import { USER_ROLE_LABEL, type UserRole } from "@/lib/domain";
import {
  IconCalendar,
  IconCash,
  IconContacts,
  IconDashboard,
  IconFinance,
  IconReservations,
  IconSettings,
  IconSubscription,
  IconTasks,
  IconUsers,
} from "@/components/icons";

const ROLE_BADGE: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-nook-terracotta/15 text-nook-terracotta",
  MARKETING: "bg-nook-sand/50 text-nook-ink",
  OPERATIONAL: "bg-nook-sage-light/40 text-nook-forest",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const role = user?.role;
  return (
    <div className="flex flex-1 min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-nook-line bg-nook-paper-warm/40">
        <div className="px-6 pt-6 pb-4">
          <Link href="/" aria-label="Nook CRM — Acasă">
            <Logo size="md" tone="forest" />
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3">
          <SidebarGroup title="Operațional">
            {canAccess(role, "dashboard") && (
              <NavLink href="/dashboard" icon={<IconDashboard />}>
                Dashboard
              </NavLink>
            )}
            {canAccess(role, "taskuri") && (
              <NavLink href="/taskuri" icon={<IconTasks />}>
                Taskuri zilnice
              </NavLink>
            )}
            {canAccess(role, "rezervari") && (
              <NavLink href="/rezervari" icon={<IconReservations />}>
                Rezervări
              </NavLink>
            )}
            {canAccess(role, "calendar") && (
              <NavLink href="/calendar" icon={<IconCalendar />}>
                Calendar
              </NavLink>
            )}
          </SidebarGroup>

          {(canAccess(role, "incasari") || canAccess(role, "financiar")) && (
            <SidebarGroup title="Bani">
              {canAccess(role, "incasari") && (
                <NavLink href="/incasari" icon={<IconCash />}>
                  Încasări potențiale
                </NavLink>
              )}
              {canAccess(role, "financiar") && (
                <NavLink href="/financiar" icon={<IconFinance />}>
                  Financiar
                </NavLink>
              )}
            </SidebarGroup>
          )}

          <SidebarGroup title="Date">
            {canAccess(role, "contacte") && (
              <NavLink href="/contacte" icon={<IconContacts />}>
                Contacte
              </NavLink>
            )}
            {canAccess(role, "abonamente") && (
              <NavLink href="/abonamente" icon={<IconSubscription />}>
                Abonamente
              </NavLink>
            )}
            {canAccess(role, "setari") && (
              <NavLink href="/setari" icon={<IconSettings />}>
                Setări
              </NavLink>
            )}
          </SidebarGroup>

          {canAccess(role, "utilizatori") && (
            <SidebarGroup title="Admin">
              <NavLink href="/utilizatori" icon={<IconUsers />}>
                Utilizatori
              </NavLink>
            </SidebarGroup>
          )}
        </nav>

        <div className="border-t border-nook-line/60 px-3 pb-6 pt-4">
          {user && (
            <div className="px-3 pb-2">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold tracking-widest uppercase text-nook-ink-soft/70">
                  Conectat ca
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                    ROLE_BADGE[user.role as UserRole] ?? "bg-nook-line text-nook-ink-soft"
                  }`}
                >
                  {USER_ROLE_LABEL[user.role as UserRole] ?? user.role}
                </span>
              </div>
              <div className="mt-0.5 truncate text-xs font-semibold text-nook-ink">
                {user.name || user.email}
              </div>
              {user.name && (
                <div className="truncate text-[11px] text-nook-ink-soft">
                  {user.email}
                </div>
              )}
            </div>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2 text-left text-xs text-nook-ink-soft transition-colors hover:bg-nook-paper-warm hover:text-nook-ink"
            >
              <span className="inline-flex items-center gap-2">
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Ieși din cont
              </span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar — placeholder simplu (mobile nav vine în etapa următoare) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-between border-b border-nook-line bg-nook-paper px-4 py-3">
        <Link href="/">
          <Logo size="sm" tone="forest" />
        </Link>
        <span className="text-xs text-nook-ink-soft">CRM</span>
      </header>

      {/* Conținut principal */}
      <main className="flex-1 lg:pt-0 pt-16">{children}</main>
    </div>
  );
}

function SidebarGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="px-3 pb-1 text-[10px] font-bold tracking-widest text-nook-ink-soft/70 uppercase">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}
