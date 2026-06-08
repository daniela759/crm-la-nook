import { PageContainer, PageHeader } from "@/components/PageHeader";
import { FunnelCards, TargetSemafor } from "@/components/Finance";
import { getSettings } from "@/lib/settings";
import {
  getFutureEstimated,
  getMonthlyFunnel,
  getUpcomingLeads,
} from "@/lib/finance";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { formatDateTime, formatMoney } from "@/lib/format";
import { requireSection } from "@/lib/permissions";

const REF_TODAY = new Date(2026, 4, 16);

export default async function IncasariPage() {
  await requireSection("incasari");
  const [settings, funnel, future, upcoming] = await Promise.all([
    getSettings(),
    getMonthlyFunnel(REF_TODAY.getFullYear(), REF_TODAY.getMonth()),
    getFutureEstimated(REF_TODAY),
    getUpcomingLeads(REF_TODAY),
  ]);

  // Grupăm rezervările viitoare pe dată (YYYY-MM-DD)
  const groupedByDay = new Map<string, typeof upcoming>();
  for (const lead of upcoming) {
    const key = lead.scheduledAt.toISOString().slice(0, 10);
    const arr = groupedByDay.get(key) ?? [];
    arr.push(lead);
    groupedByDay.set(key, arr);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Încasări potențiale"
        description="Banii pe drum — pâlnia lunii curente și toate rezervările viitoare cu valoarea estimată."
      />

      {/* Proiecție lună */}
      <div className="mt-6">
        <TargetSemafor
          amount={funnel.total}
          targets={settings.targets}
          title="Proiecția lunii curente"
          subtitle="Încasat + Confirmat + Potențial"
        />
      </div>

      {/* Pâlnia */}
      <div className="mt-6">
        <h2 className="font-display text-base font-bold text-nook-forest mb-3">
          Pâlnia lunii — luna curentă
        </h2>
        <FunnelCards
          collected={funnel.collected}
          confirmed={funnel.confirmed}
          potential={funnel.potential}
        />
      </div>

      {/* Future estimate */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <SmallStat
          label="Rezervări viitoare confirmate"
          value={formatMoney(future.confirmed)}
          help="Valoare estimată din lead-uri CONFIRMED programate după azi"
          tone="sage"
        />
        <SmallStat
          label="Rezervări viitoare în potențial"
          value={formatMoney(future.potential)}
          help="Valoare estimată din lead-uri NOU / CONTACTAT programate după azi"
          tone="terracotta"
        />
      </div>

      {/* Listă rezervări viitoare */}
      <div className="mt-8">
        <h2 className="font-display text-base font-bold text-nook-forest mb-3">
          Rezervări viitoare ({upcoming.length})
        </h2>

        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-nook-line bg-nook-paper-warm/40 p-8 text-center">
            <p className="text-sm text-nook-ink-soft">
              Nicio rezervare viitoare. Adaugă din pagina <strong>Rezervări</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(groupedByDay.entries()).map(([day, leads]) => {
              const dayTotal = leads.reduce(
                (s, l) => s + l.estimatedValue,
                0,
              );
              return (
                <div
                  key={day}
                  className="rounded-2xl bg-nook-paper ring-1 ring-nook-line overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-nook-line bg-nook-paper-warm/50 px-5 py-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-nook-ink-soft">
                      {formatDateTime(leads[0].scheduledAt).split(",")[0]}
                    </span>
                    <span className="text-xs font-semibold text-nook-ink">
                      {formatMoney(dayTotal)}
                    </span>
                  </div>
                  <ul className="divide-y divide-nook-line/60">
                    {leads.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center gap-4 px-5 py-3"
                      >
                        <div className="w-16 shrink-0 text-xs font-semibold text-nook-ink-soft">
                          {l.scheduledAt
                            .toLocaleTimeString("ro-RO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-nook-ink truncate">
                            {l.contact.lastName} {l.contact.firstName}
                          </div>
                          <div className="text-xs text-nook-ink-soft truncate">
                            {l.source.name} · {l.children.length}{" "}
                            {l.children.length === 1 ? "copil" : "copii"}
                            {l.adultsCount > 0 &&
                              ` + ${l.adultsCount} ${l.adultsCount === 1 ? "adult" : "adulți"}`}
                          </div>
                        </div>
                        <TypeBadge type={l.type} />
                        <StatusBadge status={l.status} />
                        <div className="w-20 text-right font-semibold text-nook-ink">
                          {l.estimatedValue > 0
                            ? formatMoney(l.estimatedValue)
                            : "—"}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

function SmallStat({
  label,
  value,
  help,
  tone,
}: {
  label: string;
  value: string;
  help: string;
  tone: "sage" | "terracotta";
}) {
  const map = {
    sage: "ring-nook-sage/30 bg-nook-sage/5",
    terracotta: "ring-nook-terracotta/30 bg-nook-cream/40",
  };
  return (
    <div className={`rounded-2xl ${map[tone]} ring-1 p-5`}>
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
