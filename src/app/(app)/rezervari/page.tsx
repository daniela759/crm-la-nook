import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { IconPlus } from "@/components/icons";
import { LeadActions } from "./LeadActions";
import {
  LEAD_STATUSES,
  LEAD_TYPES,
  LEAD_STATUS_LABEL,
  LEAD_TYPE_LABEL,
  type LeadStatus,
  type LeadType,
} from "@/lib/domain";
import { formatDateTime, formatMoney } from "@/lib/format";

type SearchParams = Promise<{
  status?: string;
  type?: string;
  source?: string;
}>;

export default async function RezervariPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filterStatus = (LEAD_STATUSES as readonly string[]).includes(params.status ?? "")
    ? (params.status as LeadStatus)
    : null;
  const filterType = (LEAD_TYPES as readonly string[]).includes(params.type ?? "")
    ? (params.type as LeadType)
    : null;
  const filterSource = params.source && params.source !== "all" ? params.source : null;

  const where = {
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterType ? { type: filterType } : {}),
    ...(filterSource ? { sourceId: filterSource } : {}),
  };

  const [leads, sources, statusCounts] = await Promise.all([
    db.lead.findMany({
      where,
      include: {
        contact: true,
        children: { include: { child: true } },
        source: true,
      },
      orderBy: { scheduledAt: "desc" },
    }),
    db.leadSource.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.lead.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = Object.fromEntries(
    statusCounts.map((c) => [c.status, c._count._all]),
  ) as Record<string, number>;
  const totalLeads = statusCounts.reduce((sum, c) => sum + c._count._all, 0);

  return (
    <PageContainer>
      <PageHeader
        title="Rezervări"
        description={`${totalLeads} ${totalLeads === 1 ? "rezervare" : "rezervări"} în total · ${countByStatus["NEW"] ?? 0} de confirmat, ${countByStatus["CONFIRMED"] ?? 0} confirmate`}
        action={
          <Link
            href="/rezervari/noua"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-nook-forest px-5 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink"
          >
            <IconPlus />
            Rezervare nouă
          </Link>
        }
      />

      {/* Filtre */}
      <div className="mt-6 space-y-3">
        <FilterRow
          label="Status"
          paramName="status"
          activeValue={filterStatus}
          options={LEAD_STATUSES.map((s) => ({
            value: s,
            label: LEAD_STATUS_LABEL[s],
            count: countByStatus[s] ?? 0,
          }))}
          currentParams={params}
        />
        <FilterRow
          label="Tip"
          paramName="type"
          activeValue={filterType}
          options={LEAD_TYPES.map((t) => ({ value: t, label: LEAD_TYPE_LABEL[t] }))}
          currentParams={params}
        />
        <SourceFilter
          activeValue={filterSource}
          sources={sources}
          currentParams={params}
        />
      </div>

      {/* Listă */}
      {leads.length === 0 ? (
        <EmptyState hasFilters={!!(filterStatus || filterType || filterSource)} />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-nook-paper ring-1 ring-nook-line">
          <table className="w-full">
            <thead className="border-b border-nook-line bg-nook-paper-warm/50 text-left text-[11px] font-semibold uppercase tracking-wider text-nook-ink-soft">
              <tr>
                <th className="px-5 py-3">Când</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Tip</th>
                <th className="px-5 py-3 hidden md:table-cell">Sursă</th>
                <th className="px-5 py-3 hidden lg:table-cell">Copii / Adulți</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Valoare</th>
                <th className="px-5 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nook-line/60">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-nook-paper-warm/30 transition-colors">
                  <td className="px-5 py-4 text-xs">
                    <Link href={`/rezervari/${l.id}`} className="block hover:text-nook-forest">
                      <div className="font-semibold text-nook-ink hover:text-nook-forest">
                        {formatDateTime(l.scheduledAt)}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/contacte/${l.contactId}`} className="block hover:text-nook-forest">
                      <div className="font-semibold text-nook-ink hover:text-nook-forest">
                        {l.contact.lastName} {l.contact.firstName}
                      </div>
                      <div className="text-xs text-nook-ink-soft">{l.contact.phone}</div>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <TypeBadge type={l.type} />
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-sm text-nook-ink-soft">
                    {l.source.name}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-sm text-nook-ink-soft">
                    {l.children.length} {l.children.length === 1 ? "copil" : "copii"}
                    {l.adultsCount > 0 && (
                      <span className="text-xs"> + {l.adultsCount} adult{l.adultsCount === 1 ? "" : "i"}</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-nook-ink">
                    {l.estimatedValue > 0 ? formatMoney(l.estimatedValue) : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <LeadActions leadId={l.id} status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}

// ─── Componente filtre ────────────────────────────────────────────────────
function FilterRow({
  label,
  paramName,
  activeValue,
  options,
  currentParams,
}: {
  label: string;
  paramName: string;
  activeValue: string | null;
  options: Array<{ value: string; label: string; count?: number }>;
  currentParams: Record<string, string | undefined>;
}) {
  function paramsWith(value: string | null) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(currentParams)) {
      if (k !== paramName && v) next.set(k, v);
    }
    if (value) next.set(paramName, value);
    const q = next.toString();
    return q ? `/rezervari?${q}` : "/rezervari";
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold tracking-wider uppercase text-nook-ink-soft min-w-[3rem]">
        {label}
      </span>
      <FilterChip href={paramsWith(null)} active={!activeValue}>
        Toate
      </FilterChip>
      {options.map((o) => (
        <FilterChip
          key={o.value}
          href={paramsWith(o.value)}
          active={activeValue === o.value}
        >
          {o.label}
          {o.count != null && o.count > 0 && (
            <span className="ml-1 opacity-70">· {o.count}</span>
          )}
        </FilterChip>
      ))}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-nook-forest text-nook-paper"
          : "bg-nook-paper text-nook-ink-soft ring-1 ring-nook-line hover:text-nook-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function SourceFilter({
  activeValue,
  sources,
  currentParams,
}: {
  activeValue: string | null;
  sources: Array<{ id: string; name: string }>;
  currentParams: Record<string, string | undefined>;
}) {
  function paramsWith(value: string | null) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(currentParams)) {
      if (k !== "source" && v) next.set(k, v);
    }
    if (value) next.set("source", value);
    const q = next.toString();
    return q ? `/rezervari?${q}` : "/rezervari";
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold tracking-wider uppercase text-nook-ink-soft min-w-[3rem]">
        Sursă
      </span>
      <FilterChip href={paramsWith(null)} active={!activeValue}>
        Toate
      </FilterChip>
      {sources.map((s) => (
        <FilterChip
          key={s.id}
          href={paramsWith(s.id)}
          active={activeValue === s.id}
        >
          {s.name}
        </FilterChip>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-nook-line bg-nook-paper-warm/50 p-12 text-center">
      <h3 className="font-display text-xl font-bold text-nook-forest">
        {hasFilters ? "Niciun rezultat" : "Nicio rezervare încă"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-nook-ink-soft">
        {hasFilters
          ? "Niciuna nu se potrivește filtrelor selectate. Resetează filtrele sau adaugă o rezervare nouă."
          : "Adaugă prima rezervare ca să începi."}
      </p>
      <Link
        href="/rezervari/noua"
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-nook-forest px-5 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink"
      >
        <IconPlus />
        Rezervare nouă
      </Link>
    </div>
  );
}
