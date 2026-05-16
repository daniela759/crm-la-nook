import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconBack } from "@/components/icons";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { LeadActions } from "../LeadActions";
import {
  REVENUE_TYPE_LABEL,
  TRANSACTION_STATUS_LABEL,
  type RevenueType,
  type TransactionStatus,
} from "@/lib/domain";
import {
  ageFromBirthDate,
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/lib/format";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      contact: true,
      source: true,
      event: true,
      children: { include: { child: true } },
      transactions: { orderBy: { date: "desc" } },
    },
  });
  if (!lead) notFound();

  const collected = lead.transactions
    .filter((t) => t.status === "COLLECTED")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <PageContainer>
      <Link
        href="/rezervari"
        className="inline-flex items-center gap-1.5 text-sm text-nook-ink-soft hover:text-nook-ink mb-4"
      >
        <IconBack />
        Înapoi la rezervări
      </Link>

      <PageHeader
        title={`Rezervare · ${formatDateTime(lead.scheduledAt)}`}
        description={`${lead.contact.lastName} ${lead.contact.firstName} · ${lead.source.name}`}
        action={
          <div className="flex items-center gap-2">
            <TypeBadge type={lead.type} />
            <StatusBadge status={lead.status} />
          </div>
        }
      />

      {/* Sumar */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Copii" value={lead.children.length.toString()} />
        <SummaryCard label="Adulți" value={lead.adultsCount.toString()} />
        <SummaryCard
          label="Valoare estimată / încasată"
          value={`${formatMoney(lead.estimatedValue)} / ${formatMoney(collected)}`}
          tone="forest"
        />
      </div>

      {/* Detalii + acțiuni */}
      <div className="mt-6 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-nook-forest">
            Acțiuni pe rezervare
          </h2>
          <LeadActions leadId={lead.id} status={lead.status} />
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <Row label="Contact">
            <Link
              href={`/contacte/${lead.contactId}`}
              className="text-nook-forest hover:underline"
            >
              {lead.contact.lastName} {lead.contact.firstName}
            </Link>
            <div className="text-xs text-nook-ink-soft">
              {lead.contact.phone} · {lead.contact.email}
            </div>
          </Row>
          <Row label="Programat" value={formatDateTime(lead.scheduledAt)} />
          <Row label="Sursă" value={lead.source.name} />
          <Row label="Creat" value={formatDateTime(lead.createdAt)} />
          {lead.event && <Row label="Eveniment" value={lead.event.name} />}
          {lead.notes && (
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
                Note
              </dt>
              <dd className="mt-1 text-sm text-nook-ink whitespace-pre-wrap">
                {lead.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Copii la rezervare */}
      {lead.children.length > 0 && (
        <div className="mt-6 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
          <h2 className="font-display text-lg font-bold text-nook-forest mb-4">
            Copii la această rezervare ({lead.children.length})
          </h2>
          <ul className="flex flex-wrap gap-2">
            {lead.children.map((lc) => (
              <li
                key={lc.childId}
                className="inline-flex items-center rounded-full bg-nook-sage-light/50 px-3 py-1 text-sm text-nook-ink"
              >
                {lc.child.name} · {ageFromBirthDate(lc.child.birthDate)} ani
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tranzacții */}
      <div className="mt-6 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
        <h2 className="font-display text-lg font-bold text-nook-forest mb-4">
          Tranzacții ({lead.transactions.length})
        </h2>
        {lead.transactions.length === 0 ? (
          <p className="text-sm italic text-nook-ink-soft">
            Nicio tranzacție pe această rezervare.
          </p>
        ) : (
          <ul className="divide-y divide-nook-line/60">
            {lead.transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="w-24 text-xs text-nook-ink-soft shrink-0">
                  {formatDate(t.date)}
                </div>
                <div className="flex-1 font-medium text-nook-ink">
                  {REVENUE_TYPE_LABEL[t.revenueType as RevenueType]}
                </div>
                <span className="rounded-full bg-state-green/15 px-2 py-0.5 text-[10px] font-medium text-state-green">
                  {TRANSACTION_STATUS_LABEL[t.status as TransactionStatus]}
                </span>
                <div className="w-20 text-right font-semibold text-nook-ink">
                  {formatMoney(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "forest";
}) {
  const map = {
    default: "bg-nook-paper ring-nook-line",
    forest: "bg-nook-forest text-nook-paper",
  };
  return (
    <div className={`rounded-2xl ring-1 p-4 ${map[tone]}`}>
      <div className="text-[11px] font-bold tracking-widest uppercase opacity-80">
        {label}
      </div>
      <div className="mt-1 text-xl font-display font-bold">{value}</div>
    </div>
  );
}

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-nook-ink">{children ?? value}</dd>
    </div>
  );
}
