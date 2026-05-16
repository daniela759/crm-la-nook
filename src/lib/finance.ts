import { db } from "@/lib/db";
import { REVENUE_TYPES, type RevenueType } from "@/lib/domain";
import type { Targets } from "@/lib/settings";

/** Începutul lunii la 00:00 local */
export function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1);
}
/** Începutul lunii următoare — exclusiv */
export function nextMonthStart(year: number, month: number): Date {
  return new Date(year, month + 1, 1);
}

export type TargetTone = "RED" | "YELLOW" | "GREEN" | "GREEN_BRIGHT";

/** Care zonă de target (semafor) atinge suma dată. */
export function targetStatus(amount: number, targets: Targets): TargetTone {
  if (amount < targets.survival) return "RED";
  if (amount < targets.breakEven) return "YELLOW";
  if (amount < targets.profitability) return "GREEN";
  return "GREEN_BRIGHT";
}

export const TARGET_LABEL: Record<TargetTone, string> = {
  RED: "Sub minim",
  YELLOW: "Sub break-even",
  GREEN: "Profitabilitate în curs",
  GREEN_BRIGHT: "Profitabilitate atinsă",
};

export const TARGET_HELP: Record<TargetTone, string> = {
  RED: "Afacerea pierde — focus urgent pe conversie",
  YELLOW: "Acoperă, dar nu costurile — împinge spre break-even",
  GREEN: "Break-even depășit — apropiere de target",
  GREEN_BRIGHT: "Target de profitabilitate atins",
};

export type MonthlyFunnel = {
  collected: number; // tranzacții COLLECTED
  confirmed: number; // lead-uri CONFIRMED × estimatedValue
  potential: number; // lead-uri NEW/CONTACTED × estimatedValue
  total: number; // collected + confirmed + potential
};

/** Pâlnia financiară pe luna dată (din scheduledAt pt. confirmat/potențial, din transactions.date pt. încasat). */
export async function getMonthlyFunnel(year: number, month: number): Promise<MonthlyFunnel> {
  const start = monthStart(year, month);
  const end = nextMonthStart(year, month);

  const [collectedAgg, confirmedAgg, potentialAgg] = await Promise.all([
    db.transaction.aggregate({
      where: { date: { gte: start, lt: end }, status: "COLLECTED" },
      _sum: { amount: true },
    }),
    db.lead.aggregate({
      where: { scheduledAt: { gte: start, lt: end }, status: "CONFIRMED" },
      _sum: { estimatedValue: true },
    }),
    db.lead.aggregate({
      where: {
        scheduledAt: { gte: start, lt: end },
        status: { in: ["NEW", "CONTACTED"] },
      },
      _sum: { estimatedValue: true },
    }),
  ]);

  const collected = collectedAgg._sum.amount ?? 0;
  const confirmed = confirmedAgg._sum.estimatedValue ?? 0;
  const potential = potentialAgg._sum.estimatedValue ?? 0;

  return {
    collected,
    confirmed,
    potential,
    total: collected + confirmed + potential,
  };
}

export type RevenueBreakdownItem = {
  key: string;
  label: string;
  amount: number;
  count: number;
};

/** Defalcare venit ÎNCASAT pe tip de venit. */
export async function getRevenueByType(
  year: number,
  month: number,
): Promise<RevenueBreakdownItem[]> {
  const start = monthStart(year, month);
  const end = nextMonthStart(year, month);

  const groups = await db.transaction.groupBy({
    by: ["revenueType"],
    where: { date: { gte: start, lt: end }, status: "COLLECTED" },
    _sum: { amount: true },
    _count: { _all: true },
  });

  // Asigurăm că toate tipurile apar (chiar dacă 0)
  const labelMap: Record<RevenueType, string> = {
    CHILD_VISIT: "Vizite copii",
    PARENT_VISIT: "Vizite părinți",
    BIRTHDAY: "Zile de naștere",
    EVENT: "Evenimente",
    SUBSCRIPTION: "Abonamente",
  };
  const result = REVENUE_TYPES.map((rt) => {
    const g = groups.find((x) => x.revenueType === rt);
    return {
      key: rt,
      label: labelMap[rt],
      amount: g?._sum.amount ?? 0,
      count: g?._count._all ?? 0,
    };
  });
  return result.sort((a, b) => b.amount - a.amount);
}

/** Defalcare venit ÎNCASAT pe sursă de lead (urmărim lead-urile cu tranzacțiile lor). */
export async function getRevenueBySource(
  year: number,
  month: number,
): Promise<RevenueBreakdownItem[]> {
  const start = monthStart(year, month);
  const end = nextMonthStart(year, month);

  const txs = await db.transaction.findMany({
    where: { date: { gte: start, lt: end }, status: "COLLECTED" },
    include: { lead: { include: { source: true } } },
  });

  const bySource = new Map<string, { name: string; amount: number; count: number }>();
  for (const t of txs) {
    const key = t.lead?.source.id ?? "__none__";
    const name = t.lead?.source.name ?? "Fără sursă (abonament direct)";
    const e = bySource.get(key) ?? { name, amount: 0, count: 0 };
    e.amount += t.amount;
    e.count += 1;
    bySource.set(key, e);
  }

  return Array.from(bySource.entries())
    .map(([key, v]) => ({ key, label: v.name, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount);
}

/** Trend lunar — ultimele N luni, inclusiv luna referință. */
export async function getMonthlyTrend(
  refYear: number,
  refMonth: number,
  months = 12,
): Promise<Array<{ year: number; month: number; collected: number }>> {
  const result: Array<{ year: number; month: number; collected: number }> = [];
  for (let i = months - 1; i >= 0; i--) {
    const y = refYear;
    const m = refMonth - i;
    const date = new Date(y, m, 1);
    const yy = date.getFullYear();
    const mm = date.getMonth();
    const start = monthStart(yy, mm);
    const end = nextMonthStart(yy, mm);
    const agg = await db.transaction.aggregate({
      where: { date: { gte: start, lt: end }, status: "COLLECTED" },
      _sum: { amount: true },
    });
    result.push({ year: yy, month: mm, collected: agg._sum.amount ?? 0 });
  }
  return result;
}

/** Suma valorii estimate pentru lead-urile viitoare (după ziua de azi). */
export async function getFutureEstimated(refDate = new Date()): Promise<{
  potential: number;
  confirmed: number;
}> {
  const [potential, confirmed] = await Promise.all([
    db.lead.aggregate({
      where: {
        scheduledAt: { gt: refDate },
        status: { in: ["NEW", "CONTACTED"] },
      },
      _sum: { estimatedValue: true },
    }),
    db.lead.aggregate({
      where: { scheduledAt: { gt: refDate }, status: "CONFIRMED" },
      _sum: { estimatedValue: true },
    }),
  ]);
  return {
    potential: potential._sum.estimatedValue ?? 0,
    confirmed: confirmed._sum.estimatedValue ?? 0,
  };
}

/** Listă lead-uri viitoare (pentru pagina /incasari) — grupate per dată cu valoare. */
export async function getUpcomingLeads(refDate = new Date()) {
  return db.lead.findMany({
    where: {
      scheduledAt: { gte: refDate },
      status: { in: ["NEW", "CONTACTED", "CONFIRMED"] },
    },
    include: {
      contact: { select: { firstName: true, lastName: true } },
      source: { select: { name: true } },
      children: true,
    },
    orderBy: { scheduledAt: "asc" },
  });
}

const MONTH_LABEL_RO = [
  "ian.", "feb.", "mar.", "apr.", "mai", "iun.",
  "iul.", "aug.", "sep.", "oct.", "nov.", "dec.",
];

export function monthShortLabel(year: number, month: number, withYear = false): string {
  const m = MONTH_LABEL_RO[month] ?? "";
  return withYear ? `${m} ${year}` : m;
}
