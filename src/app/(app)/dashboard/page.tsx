import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { TargetSemafor, BreakdownList } from "@/components/Finance";
import { StatusBadge } from "@/components/StatusBadge";
import { getSettings } from "@/lib/settings";
import {
  getMonthlyFunnel,
  getRevenueBySource,
} from "@/lib/finance";
import {
  computeScore,
  computeStage,
  SCORE_TONE_LABEL,
  scoreTone,
} from "@/lib/scoring";
import {
  PIPELINE_STAGE_LABEL,
  type PipelineStage,
} from "@/lib/domain";
import { formatDate, formatMoney } from "@/lib/format";

const REF_TODAY = new Date(2026, 4, 16);

export default async function DashboardPage() {
  const settings = await getSettings();
  const year = REF_TODAY.getFullYear();
  const month = REF_TODAY.getMonth();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const [
    funnel,
    bySource,
    leadsThisMonth,
    presentsThisMonth,
    absentsThisMonth,
    activeSubs,
    almostDoneSubs,
    allContactsWithLeads,
    pendingTasks,
  ] = await Promise.all([
    getMonthlyFunnel(year, month),
    getRevenueBySource(year, month),
    db.lead.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
    db.lead.count({
      where: { scheduledAt: { gte: monthStart, lt: monthEnd }, status: "PRESENT" },
    }),
    db.lead.count({
      where: { scheduledAt: { gte: monthStart, lt: monthEnd }, status: "ABSENT" },
    }),
    db.subscription.findMany(),
    db.subscription.findMany({
      include: { contact: { select: { firstName: true, lastName: true, phone: true } } },
    }),
    db.contact.findMany({
      include: {
        leads: { select: { type: true, status: true, scheduledAt: true, createdAt: true } },
        subscriptions: { select: { totalEntries: true, usedEntries: true, purchasedAt: true } },
      },
    }),
    db.task.findMany({
      where: { status: { in: ["TODO", "IN_PROGRESS"] } },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      take: 5,
      include: { contact: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  // Calcul scor + stadiu pentru toate contactele
  const enriched = allContactsWithLeads.map((c) => {
    const score = computeScore(
      { leads: c.leads, subscriptions: c.subscriptions, referenceDate: REF_TODAY },
      settings.scoreRules,
    );
    const stage = computeStage(
      { leads: c.leads, subscriptions: c.subscriptions, referenceDate: REF_TODAY },
      score,
      settings.scoreRules,
    );
    return { ...c, score, stage };
  });

  const hotOpportunities = enriched
    .filter(
      (c) =>
        c.stage === "READY_FOR_SUBSCRIPTION" ||
        (c.score >= settings.scoreRules.threshold &&
          !c.subscriptions.some((s) => s.usedEntries < s.totalEntries)),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const subscriptionsActive = activeSubs.filter(
    (s) => s.usedEntries < s.totalEntries,
  );
  const subscriptionsAlmostDone = almostDoneSubs.filter(
    (s) => s.totalEntries - s.usedEntries <= 1 && s.totalEntries - s.usedEntries >= 0,
  );

  // Rate
  const totalScheduledThisMonth = presentsThisMonth + absentsThisMonth;
  const noShowRate =
    totalScheduledThisMonth > 0
      ? (absentsThisMonth / totalScheduledThisMonth) * 100
      : 0;
  const conversionRate =
    leadsThisMonth > 0 ? (presentsThisMonth / leadsThisMonth) * 100 : 0;

  // Distribuție pe stadii
  const stageCounts = new Map<PipelineStage, number>();
  for (const c of enriched) {
    stageCounts.set(c.stage, (stageCounts.get(c.stage) ?? 0) + 1);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Sănătatea afacerii într-o privire — venit, oportunități și abonamente."
      />

      {/* Card mare cu semafor */}
      <div className="mt-6">
        <TargetSemafor
          amount={funnel.collected}
          targets={settings.targets}
          title="Venit luna curentă · mai 2026"
          subtitle={`Proiecție totală: ${formatMoney(funnel.total)} (Încasat + Confirmat + Potențial)`}
        />
      </div>

      {/* KPI mici */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Lead-uri noi"
          value={leadsThisMonth.toString()}
          help="Înregistrate luna aceasta"
        />
        <KpiCard
          label="Conversie lead → vizită"
          value={`${conversionRate.toFixed(0)}%`}
          help={`${presentsThisMonth} prezenți din ${leadsThisMonth} lead-uri`}
        />
        <KpiCard
          label="Rata no-show"
          value={`${noShowRate.toFixed(0)}%`}
          help={`${absentsThisMonth} absenți din ${totalScheduledThisMonth} programate`}
          tone={noShowRate > 15 ? "red" : "default"}
        />
        <KpiCard
          label="Abonamente active"
          value={subscriptionsActive.length.toString()}
          help={`${subscriptionsAlmostDone.length} aproape consumate`}
          tone="sage"
        />
      </div>

      {/* Două coloane: oportunități + abonamente care expiră */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Section
          title="Oportunități fierbinți"
          subtitle="Contacte pregătite pentru abonament — scor ≥ 60"
        >
          {hotOpportunities.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">
              Niciun contact peste prag deocamdată. Continuă să aduci vizitatori.
            </p>
          ) : (
            <ul className="space-y-2">
              {hotOpportunities.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-xl bg-nook-paper-warm/40 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-nook-ink">
                      {c.lastName} {c.firstName}
                    </div>
                    <div className="text-[11px] text-nook-ink-soft">
                      {PIPELINE_STAGE_LABEL[c.stage]} · {c.phone}
                    </div>
                  </div>
                  <ScoreBadge score={c.score} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Abonamente aproape consumate"
          subtitle="≤ 1 intrare rămasă — propune reînnoirea"
        >
          {subscriptionsAlmostDone.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">
              Niciun abonament aproape consumat acum.
            </p>
          ) : (
            <ul className="space-y-2">
              {subscriptionsAlmostDone.map((s) => {
                const remaining = s.totalEntries - s.usedEntries;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl bg-nook-paper-warm/40 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-nook-ink">
                        {s.contact.lastName} {s.contact.firstName}
                      </div>
                      <div className="text-[11px] text-nook-ink-soft">
                        {s.usedEntries}/{s.totalEntries} consumate · {s.contact.phone}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        remaining === 0
                          ? "bg-state-red/15 text-state-red"
                          : "bg-state-yellow/15 text-state-yellow"
                      }`}
                    >
                      {remaining === 0
                        ? "Consumat"
                        : `${remaining} intrare rămasă`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>

      {/* Pipeline + Surse */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Section
          title="Distribuție pipeline"
          subtitle="Câte contacte sunt în fiecare stadiu"
        >
          <ul className="space-y-1.5">
            {(
              [
                "LEAD_NEW",
                "CONFIRMED_RESERVATION",
                "FIRST_VISIT",
                "RECURRING_VISITOR",
                "READY_FOR_SUBSCRIPTION",
                "SUBSCRIBED",
                "LOYAL_SUBSCRIBER",
                "NO_SHOW",
                "INACTIVE",
              ] as PipelineStage[]
            ).map((s) => {
              const count = stageCounts.get(s) ?? 0;
              return (
                <li key={s} className="flex items-center justify-between text-sm">
                  <span className="text-nook-ink">{PIPELINE_STAGE_LABEL[s]}</span>
                  <span
                    className={`text-nook-ink-soft ${count > 0 ? "font-semibold text-nook-ink" : ""}`}
                  >
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section
          title="Venit pe sursă · luna curentă"
          subtitle="Unde merită investit bugetul de marketing"
        >
          <BreakdownList items={bySource} emptyText="Nicio sursă activă." />
        </Section>
      </div>

      {/* Următoarele taskuri */}
      <div className="mt-8">
        <Section
          title={`Următoarele ${pendingTasks.length} taskuri`}
          subtitle="Cele mai urgente · vezi toate pe pagina Taskuri zilnice"
        >
          {pendingTasks.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">
              Niciun task activ. Rulează automatizările din pagina{" "}
              <Link href="/taskuri" className="underline">
                Taskuri zilnice
              </Link>{" "}
              ca să le generezi.
            </p>
          ) : (
            <ul className="space-y-2">
              {pendingTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-nook-ink">{t.title}</span>
                  <span className="text-[11px] text-nook-ink-soft">
                    {formatDate(t.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/taskuri"
            className="mt-4 inline-block text-xs font-medium text-nook-forest hover:underline"
          >
            Vezi toate taskurile →
          </Link>
        </Section>
      </div>
    </PageContainer>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-5">
      <h3 className="font-display text-base font-bold text-nook-forest">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 mb-3 text-xs text-nook-ink-soft">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

function KpiCard({
  label,
  value,
  help,
  tone = "default",
}: {
  label: string;
  value: string;
  help: string;
  tone?: "default" | "red" | "sage";
}) {
  const map = {
    default: "bg-nook-paper ring-nook-line",
    red: "bg-state-red/10 ring-state-red/30",
    sage: "bg-nook-sage/10 ring-nook-sage/30",
  };
  return (
    <div className={`rounded-2xl ring-1 p-5 ${map[tone]}`}>
      <div className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold text-nook-ink">
        {value}
      </div>
      <div className="mt-1 text-xs text-nook-ink-soft">{help}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const map = {
    cold: "bg-nook-line text-nook-ink-soft",
    warm: "bg-nook-sand/50 text-nook-ink",
    ready: "bg-nook-forest text-nook-paper",
    ambassador: "bg-nook-terracotta text-nook-paper",
  };
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>
      {score} · {SCORE_TONE_LABEL[tone]}
    </span>
  );
}
