import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { getSettings } from "@/lib/settings";
import {
  getMonthlyFunnel,
  getMonthlyTrend,
  getRevenueBySource,
  getRevenueByType,
  monthShortLabel,
} from "@/lib/finance";
import {
  BreakdownList,
  FunnelCards,
  TargetSemafor,
} from "@/components/Finance";
import { formatMoney } from "@/lib/format";

type SearchParams = Promise<{ y?: string; m?: string }>;

const REF_TODAY = new Date(2026, 4, 16); // 16 mai 2026 — referință consistentă cu seed

export default async function FinanciarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { y: yParam, m: mParam } = await searchParams;
  const year = Number(yParam) || REF_TODAY.getFullYear();
  const month =
    mParam != null && !Number.isNaN(Number(mParam))
      ? Number(mParam)
      : REF_TODAY.getMonth();

  const [settings, funnel, byType, bySource, trend] = await Promise.all([
    getSettings(),
    getMonthlyFunnel(year, month),
    getRevenueByType(year, month),
    getRevenueBySource(year, month),
    getMonthlyTrend(year, month, 12),
  ]);

  const monthLabel = `${monthShortLabel(year, month, true)}`;
  const prev = navParams(year, month, -1);
  const next = navParams(year, month, 1);
  const isCurrent = year === REF_TODAY.getFullYear() && month === REF_TODAY.getMonth();

  return (
    <PageContainer>
      <PageHeader
        title="Financiar"
        description={`Venitul lunii ${monthLabel} comparat cu cele 3 targete + defalcare pe surse de venit și de lead.`}
      />

      {/* Navigare lunară */}
      <div className="mt-6 flex items-center justify-between">
        <div className="font-display text-lg font-bold text-nook-forest">
          {monthLabel}
        </div>
        <div className="flex gap-2">
          <NavBtn href={`/financiar?y=${prev.year}&m=${prev.month}`}>← Anterior</NavBtn>
          {!isCurrent && (
            <NavBtn
              href={`/financiar?y=${REF_TODAY.getFullYear()}&m=${REF_TODAY.getMonth()}`}
              primary
            >
              Luna curentă
            </NavBtn>
          )}
          <NavBtn href={`/financiar?y=${next.year}&m=${next.month}`}>Următor →</NavBtn>
        </div>
      </div>

      {/* Semafor + Pâlnia */}
      <div className="mt-6 space-y-4">
        <TargetSemafor
          amount={funnel.collected}
          targets={settings.targets}
          title={`Venit încasat · ${monthLabel}`}
          subtitle="Tranzacții cu plata efectiv primită"
        />

        <div>
          <h2 className="font-display text-base font-bold text-nook-forest mb-3">
            Pâlnia lunii — proiecție{" "}
            <span className="text-nook-ink-soft">
              {formatMoney(funnel.total)}
            </span>
          </h2>
          <FunnelCards
            collected={funnel.collected}
            confirmed={funnel.confirmed}
            potential={funnel.potential}
          />
        </div>
      </div>

      {/* Defalcări */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Section title="Venit pe tip">
          <BreakdownList items={byType} emptyText="Nicio încasare luna aceasta." />
        </Section>
        <Section title="Venit pe sursă de lead">
          <BreakdownList
            items={bySource}
            emptyText="Nicio încasare luna aceasta."
          />
        </Section>
      </div>

      {/* Trend 12 luni */}
      <div className="mt-8">
        <h2 className="font-display text-base font-bold text-nook-forest mb-3">
          Trend · ultimele 12 luni
        </h2>
        <TrendChart trend={trend} targets={settings.targets} />
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-5">
      <h3 className="font-display text-base font-bold text-nook-forest mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function TrendChart({
  trend,
  targets,
}: {
  trend: Array<{ year: number; month: number; collected: number }>;
  targets: { survival: number; breakEven: number; profitability: number };
}) {
  const max = Math.max(targets.profitability * 1.1, ...trend.map((t) => t.collected));
  return (
    <div className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-5">
      <div className="flex items-end gap-2 h-40">
        {trend.map((t) => {
          const h = max > 0 ? (t.collected / max) * 100 : 0;
          let tone: string;
          if (t.collected >= targets.profitability) tone = "bg-state-green-bright";
          else if (t.collected >= targets.breakEven) tone = "bg-state-green";
          else if (t.collected >= targets.survival) tone = "bg-state-yellow";
          else tone = "bg-state-red";
          return (
            <div
              key={`${t.year}-${t.month}`}
              className="flex flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="text-[10px] font-medium text-nook-ink-soft">
                {t.collected > 0 ? `${Math.round(t.collected / 1000)}k` : ""}
              </span>
              <div
                className={`w-full ${tone} rounded-t transition-all min-h-[2px]`}
                style={{ height: `${h}%` }}
              />
              <span className="text-[10px] text-nook-ink-soft">
                {monthShortLabel(t.year, t.month)}
              </span>
            </div>
          );
        })}
      </div>
      {/* Linii de prag */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-nook-ink-soft">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-state-red" />
          &lt; 18k
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-state-yellow" />
          18–30k
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-state-green" />
          30–50k
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-state-green-bright" />
          50k+
        </span>
      </div>
    </div>
  );
}

function navParams(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
