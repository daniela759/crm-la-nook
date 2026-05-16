import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { getSettings } from "@/lib/settings";
import {
  addDays,
  enrichSlots,
  getSlotsForDay,
  getWeekDays,
  getWeekStart,
  leadsOutsideSchedule,
  parseWeekKey,
  weekKey,
  type CalendarLead,
} from "@/lib/calendar";
import { formatDate, formatWeekday } from "@/lib/format";
import { OutOfScheduleCard, SlotCard } from "./SlotCard";

type SearchParams = Promise<{ week?: string }>;

const REF_TODAY = new Date(2026, 4, 16); // 16 mai 2026 — referință consistentă cu seed

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { week } = await searchParams;
  const baseDate = parseWeekKey(week) ?? REF_TODAY;
  const weekStart = getWeekStart(baseDate);
  const weekEnd = addDays(weekStart, 7);
  const days = getWeekDays(weekStart);

  const [settings, leads] = await Promise.all([
    getSettings(),
    db.lead.findMany({
      where: {
        scheduledAt: { gte: weekStart, lt: weekEnd },
        status: { notIn: ["CANCELLED"] },
      },
      include: {
        contact: { select: { firstName: true, lastName: true } },
        children: { include: { child: { select: { id: true, name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const allLeads: CalendarLead[] = leads.map((l) => ({
    id: l.id,
    type: l.type,
    status: l.status,
    scheduledAt: l.scheduledAt,
    adultsCount: l.adultsCount,
    estimatedValue: l.estimatedValue,
    contact: l.contact,
    children: l.children.map((c) => ({ child: c.child })),
  }));

  // Navigare prev / next / azi
  const prevWeek = weekKey(addDays(weekStart, -7));
  const nextWeek = weekKey(addDays(weekStart, 7));
  const todayWeek = weekKey(getWeekStart(REF_TODAY));
  const isCurrentWeek = weekKey(weekStart) === todayWeek;

  const weekLabel = `${formatDate(weekStart)} – ${formatDate(addDays(weekStart, 6))}`;

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Spațiul de joacă văzut ca ocupare în timp. Sloturile standard se generează din program. Zilele de naștere blochează tot intervalul."
      />

      {/* Navigare săptămânală */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-xl font-bold text-nook-forest">
            {weekLabel}
          </div>
          <div className="text-xs text-nook-ink-soft">
            {leads.length} {leads.length === 1 ? "rezervare" : "rezervări"} în această săptămână
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NavBtn href={`/calendar?week=${prevWeek}`}>← Anterioară</NavBtn>
          {!isCurrentWeek && (
            <NavBtn href={`/calendar?week=${todayWeek}`} primary>
              Astăzi
            </NavBtn>
          )}
          <NavBtn href={`/calendar?week=${nextWeek}`}>Următoare →</NavBtn>
        </div>
      </div>

      {/* Grid săptămânal — pe desktop 7 coloane, pe mobil stack vertical */}
      <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const slots = getSlotsForDay(day, settings.schedule);
          const dayLeads = allLeads.filter(
            (l) =>
              l.scheduledAt.getFullYear() === day.getFullYear() &&
              l.scheduledAt.getMonth() === day.getMonth() &&
              l.scheduledAt.getDate() === day.getDate(),
          );
          const enriched = enrichSlots(slots, dayLeads);
          const outside = leadsOutsideSchedule(slots, dayLeads);

          const isToday =
            day.getFullYear() === REF_TODAY.getFullYear() &&
            day.getMonth() === REF_TODAY.getMonth() &&
            day.getDate() === REF_TODAY.getDate();

          return (
            <div
              key={day.getTime()}
              className={`flex flex-col gap-2 rounded-2xl p-3 ${
                isToday
                  ? "bg-nook-sage-light/40 ring-2 ring-nook-forest"
                  : "bg-nook-paper-warm/30 ring-1 ring-nook-line"
              }`}
            >
              {/* Header zi */}
              <div className="px-1 pb-1">
                <div
                  className={`text-[10px] font-bold tracking-widest uppercase ${
                    isToday ? "text-nook-forest" : "text-nook-ink-soft"
                  }`}
                >
                  {formatWeekday(day)}
                </div>
                <div className="mt-0.5 font-display text-lg font-bold text-nook-ink">
                  {day.getDate()}
                  <span className="ml-1 text-xs font-medium text-nook-ink-soft">
                    {monthShort(day)}
                  </span>
                </div>
              </div>

              {/* Sloturi sau "închis" */}
              {enriched.length === 0 ? (
                <div className="rounded-xl border border-dashed border-nook-line/70 p-3 text-center text-[11px] italic text-nook-ink-soft">
                  Închis
                </div>
              ) : (
                enriched.map((slot) => (
                  <SlotCard key={slot.startTime} slot={slot} />
                ))
              )}

              <OutOfScheduleCard
                leads={outside.map((l) => ({
                  id: l.id,
                  type: l.type,
                  scheduledAt: l.scheduledAt,
                  contact: l.contact,
                  children: l.children,
                }))}
              />
            </div>
          );
        })}
      </div>

      {/* Legendă */}
      <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-nook-ink-soft">
        <LegendDot color="bg-nook-sage" label="Sub 75% ocupare" />
        <LegendDot color="bg-state-yellow" label="Aproape plin (75%+)" />
        <LegendDot color="bg-state-red" label="Plin (100%)" />
        <LegendSquare bg="bg-nook-cream" label="Zi de naștere" />
        <LegendSquare bg="bg-nook-sage-light/60" label="Eveniment" />
      </div>
    </PageContainer>
  );
}

function NavBtn({
  href,
  primary,
  children,
}: {
  href: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-medium transition-colors ${
        primary
          ? "bg-nook-forest text-nook-paper hover:bg-nook-ink"
          : "bg-nook-paper text-nook-ink-soft ring-1 ring-nook-line hover:text-nook-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function LegendSquare({ bg, label }: { bg: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${bg} ring-1 ring-nook-line`} />
      {label}
    </span>
  );
}

function monthShort(d: Date) {
  return new Intl.DateTimeFormat("ro-RO", { month: "short" }).format(d);
}
