import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
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
} from "@/components/icons";

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
            <NavLink href="/dashboard" icon={<IconDashboard />}>
              Dashboard
            </NavLink>
            <NavLink href="/taskuri" icon={<IconTasks />}>
              Taskuri zilnice
            </NavLink>
            <NavLink href="/rezervari" icon={<IconReservations />}>
              Rezervări
            </NavLink>
            <NavLink href="/calendar" icon={<IconCalendar />}>
              Calendar
            </NavLink>
          </SidebarGroup>

          <SidebarGroup title="Bani">
            <NavLink href="/incasari" icon={<IconCash />}>
              Încasări potențiale
            </NavLink>
            <NavLink href="/financiar" icon={<IconFinance />}>
              Financiar
            </NavLink>
          </SidebarGroup>

          <SidebarGroup title="Date">
            <NavLink href="/contacte" icon={<IconContacts />}>
              Contacte
            </NavLink>
            <NavLink href="/abonamente" icon={<IconSubscription />}>
              Abonamente
            </NavLink>
            <NavLink href="/setari" icon={<IconSettings />}>
              Setări
            </NavLink>
          </SidebarGroup>
        </nav>

        <div className="px-6 pb-6 pt-4">
          <div className="rounded-xl bg-nook-paper p-3 ring-1 ring-nook-line">
            <div className="text-[10px] font-bold tracking-widest text-nook-terracotta">
              ÎN CONSTRUCȚIE
            </div>
            <div className="mt-1 text-xs text-nook-ink-soft">
              Etapa 2 din 6 · Bază de date și contacte
            </div>
          </div>
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
