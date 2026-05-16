import type { Schedule } from "@/lib/settings";

/**
 * Returnează Luni-ul săptămânii care conține `date` (la 00:00, ora locală).
 * Lunea e prima zi (ISO week date).
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Adaugă `n` zile la `date` și întoarce un Date nou. */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Returnează cele 7 zile ale săptămânii, începând cu Luni. */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Cheie de săptămână în URL — format ISO `YYYY-MM-DD` (Lunea săptămânii). */
export function weekKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse `YYYY-MM-DD` la Date (la 00:00 local). Null dacă nevalid. */
export function parseWeekKey(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export type StandardSlot = {
  /** Data calendaristică (00:00) */
  date: Date;
  /** „HH:mm" */
  startTime: string;
  endTime: string;
  /** Datetime concret pentru începutul slotului */
  startsAt: Date;
  /** Datetime concret pentru finalul slotului */
  endsAt: Date;
  /** Capacitate configurată (din schedule.slotCapacity) */
  capacity: number;
};

/** Returnează sloturile standard pentru o zi, conform programului. */
export function getSlotsForDay(date: Date, schedule: Schedule): StandardSlot[] {
  const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const intervals = isWeekend ? schedule.weekend : schedule.weekday;

  return intervals.map((iv) => {
    const [sh, sm] = iv.start.split(":").map(Number);
    const [eh, em] = iv.end.split(":").map(Number);
    const startsAt = new Date(date);
    startsAt.setHours(sh, sm, 0, 0);
    const endsAt = new Date(date);
    endsAt.setHours(eh, em, 0, 0);
    return {
      date,
      startTime: iv.start,
      endTime: iv.end,
      startsAt,
      endsAt,
      capacity: schedule.slotCapacity,
    };
  });
}

export type CalendarLead = {
  id: string;
  type: string;
  status: string;
  scheduledAt: Date;
  adultsCount: number;
  estimatedValue: number;
  contact: { firstName: string; lastName: string };
  children: { child: { id: string; name: string } }[];
};

export type EnrichedSlot = StandardSlot & {
  /** Lead-uri care încep în interiorul acestui slot. */
  leads: CalendarLead[];
  /** Există o zi de naștere sau un eveniment care ocupă tot slotul? */
  blocked: { type: "BIRTHDAY" | "EVENT"; lead: CalendarLead } | null;
  /** Câți copii sunt deja rezervați pe acest slot (din vizite, excluzând blocat). */
  childrenBooked: number;
  /** Capacitate rămasă pentru vizite (0 dacă e blocat). */
  capacityLeft: number;
};

/** Atașează lead-urile relevante fiecărui slot. */
export function enrichSlots(
  slots: StandardSlot[],
  leads: CalendarLead[],
): EnrichedSlot[] {
  return slots.map((slot) => {
    const inSlot = leads.filter((l) => {
      const t = l.scheduledAt.getTime();
      return t >= slot.startsAt.getTime() && t < slot.endsAt.getTime();
    });

    const blockingLead = inSlot.find((l) => l.type === "BIRTHDAY" || l.type === "EVENT");
    const blocked = blockingLead
      ? {
          type: blockingLead.type as "BIRTHDAY" | "EVENT",
          lead: blockingLead,
        }
      : null;

    const visits = inSlot.filter(
      (l) =>
        l.type === "VISIT" &&
        !["CANCELLED", "ABSENT"].includes(l.status),
    );
    const childrenBooked = visits.reduce(
      (sum, l) => sum + l.children.length,
      0,
    );

    return {
      ...slot,
      leads: inSlot,
      blocked,
      childrenBooked,
      capacityLeft: blocked ? 0 : Math.max(0, slot.capacity - childrenBooked),
    };
  });
}

/** Lead-uri care nu încap în niciun slot standard (în afara orarului). */
export function leadsOutsideSchedule(
  slots: StandardSlot[],
  leads: CalendarLead[],
): CalendarLead[] {
  return leads.filter((l) => {
    return !slots.some((s) => {
      const t = l.scheduledAt.getTime();
      return t >= s.startsAt.getTime() && t < s.endsAt.getTime();
    });
  });
}
