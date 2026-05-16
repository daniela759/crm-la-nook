import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconBack } from "@/components/icons";
import { StatusBadge, TypeBadge } from "@/components/StatusBadge";
import { getSettings } from "@/lib/settings";
import {
  computeScore,
  computeStage,
  SCORE_TONE_LABEL,
  scoreTone,
} from "@/lib/scoring";
import {
  PIPELINE_STAGE_LABEL,
  REVENUE_TYPE_LABEL,
  SUBSCRIPTION_TYPE_LABEL,
  TRANSACTION_STATUS_LABEL,
  type PipelineStage,
  type RevenueType,
  type SubscriptionType,
  type TransactionStatus,
} from "@/lib/domain";
import {
  ageFromBirthDate,
  formatDate,
  formatDateTime,
  formatMoney,
} from "@/lib/format";
import { EditContactForm } from "./EditContactForm";
import { AddChildForm, DeleteChildButton } from "./AddChildForm";
import { DeleteContactButton } from "./DeleteContactButton";

const REF_TODAY = new Date(2026, 4, 16);

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [contact, sources, interests, settings] = await Promise.all([
    db.contact.findUnique({
      where: { id },
      include: {
        initialSource: true,
        children: {
          orderBy: { birthDate: "asc" },
          include: { interests: { include: { interest: true } } },
        },
        leads: {
          orderBy: { scheduledAt: "desc" },
          include: { source: true, children: true },
        },
        subscriptions: { orderBy: { purchasedAt: "desc" } },
        transactions: {
          orderBy: { date: "desc" },
          include: { lead: { select: { type: true } } },
        },
      },
    }),
    db.leadSource.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.interest.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getSettings(),
  ]);

  if (!contact) notFound();

  const score = computeScore(
    {
      leads: contact.leads,
      subscriptions: contact.subscriptions,
      referenceDate: REF_TODAY,
    },
    settings.scoreRules,
  );
  const stage = computeStage(
    {
      leads: contact.leads,
      subscriptions: contact.subscriptions,
      referenceDate: REF_TODAY,
    },
    score,
    settings.scoreRules,
  );

  const totalCollected = contact.transactions
    .filter((t) => t.status === "COLLECTED")
    .reduce((sum, t) => sum + t.amount, 0);

  const hasDependentData =
    contact.leads.length > 0 ||
    contact.subscriptions.length > 0 ||
    contact.transactions.length > 0;

  return (
    <PageContainer>
      <Link
        href="/contacte"
        className="inline-flex items-center gap-1.5 text-sm text-nook-ink-soft hover:text-nook-ink mb-4"
      >
        <IconBack />
        Înapoi la contacte
      </Link>

      <PageHeader
        title={`${contact.lastName} ${contact.firstName}`}
        description={`${contact.email} · ${contact.phone}`}
        action={
          <DeleteContactButton
            contactId={contact.id}
            contactName={`${contact.lastName} ${contact.firstName}`}
            disabled={hasDependentData}
            disabledReason="Are rezervări / abonamente / tranzacții — nu poate fi șters."
          />
        }
      />

      {/* Sumar — scor, stadiu, LTV */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Stadiu pipeline"
          value={PIPELINE_STAGE_LABEL[stage]}
          tone="forest"
        />
        <SummaryCard
          label="Scor comportamental"
          value={`${score} · ${SCORE_TONE_LABEL[scoreTone(score)]}`}
          tone={
            score >= 60 ? "forest" : score >= 30 ? "sand" : score === 0 ? "line" : "sand"
          }
        />
        <SummaryCard
          label="Valoare totală (LTV)"
          value={formatMoney(totalCollected)}
          tone="sage"
        />
        <SummaryCard
          label="Înregistrat"
          value={formatDate(contact.createdAt)}
          tone="line"
        />
      </div>

      {/* Date contact */}
      <div className="mt-8 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-nook-forest">
            Date contact
          </h2>
          <EditContactForm contact={contact} sources={sources} />
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Email" value={contact.email} />
          <InfoRow label="Telefon" value={contact.phone} />
          <InfoRow label="Adresă" value={contact.address || "—"} />
          <InfoRow label="Sursă inițială" value={contact.initialSource?.name ?? "—"} />
          {contact.notes && (
            <div className="sm:col-span-2">
              <dt className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
                Note
              </dt>
              <dd className="mt-1 text-sm text-nook-ink whitespace-pre-wrap">
                {contact.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Copii */}
      <div className="mt-6 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-nook-forest">
            Copii ({contact.children.length})
          </h2>
          <AddChildForm contactId={contact.id} interests={interests} />
        </div>
        {contact.children.length === 0 ? (
          <p className="text-sm italic text-nook-ink-soft">
            Niciun copil înregistrat. Adaugă unul ca să poți face rezervări pentru el.
          </p>
        ) : (
          <ul className="space-y-3">
            {contact.children.map((ch) => (
              <li
                key={ch.id}
                className="rounded-xl bg-nook-paper-warm/30 p-4 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-nook-ink">{ch.name}</span>
                    <span className="text-xs text-nook-ink-soft">
                      {ageFromBirthDate(ch.birthDate)} ani · {formatDate(ch.birthDate)}
                    </span>
                  </div>
                  {ch.interests.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ch.interests.map((ci) => (
                        <span
                          key={ci.interestId}
                          className="inline-flex items-center rounded-full bg-nook-sage-light/50 px-2.5 py-0.5 text-[11px] text-nook-ink"
                        >
                          {ci.interest.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <DeleteChildButton
                  childId={ch.id}
                  contactId={contact.id}
                  childName={ch.name}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Două coloane: rezervări + abonamente */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
          <h2 className="font-display text-lg font-bold text-nook-forest mb-4">
            Istoric rezervări ({contact.leads.length})
          </h2>
          {contact.leads.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">Nicio rezervare.</p>
          ) : (
            <ul className="space-y-2">
              {contact.leads.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-nook-paper-warm/30 px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-nook-ink">
                      {formatDateTime(l.scheduledAt)}
                    </div>
                    <div className="text-[11px] text-nook-ink-soft">
                      {l.source.name} · {l.children.length}{" "}
                      {l.children.length === 1 ? "copil" : "copii"}
                    </div>
                  </div>
                  <TypeBadge type={l.type} />
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
          <h2 className="font-display text-lg font-bold text-nook-forest mb-4">
            Abonamente ({contact.subscriptions.length})
          </h2>
          {contact.subscriptions.length === 0 ? (
            <p className="text-sm italic text-nook-ink-soft">Niciun abonament.</p>
          ) : (
            <ul className="space-y-3">
              {contact.subscriptions.map((s) => {
                const remaining = s.totalEntries - s.usedEntries;
                const ratio = s.usedEntries / s.totalEntries;
                return (
                  <li
                    key={s.id}
                    className="rounded-xl bg-nook-paper-warm/30 p-3"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-nook-ink">
                        {SUBSCRIPTION_TYPE_LABEL[s.type as SubscriptionType]}
                      </span>
                      <span className="text-xs text-nook-ink-soft">
                        {formatMoney(s.pricePaid)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-nook-line/60">
                        <div
                          className={`h-full ${remaining === 0 ? "bg-nook-line" : "bg-nook-sage"}`}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-nook-ink-soft w-12 text-right">
                        {s.usedEntries}/{s.totalEntries}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-nook-ink-soft">
                      Cumpărat {formatDate(s.purchasedAt)}
                      {remaining === 0 && " · Consumat"}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Istoric tranzacții */}
      <div className="mt-6 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
        <h2 className="font-display text-lg font-bold text-nook-forest mb-4">
          Istoric tranzacții ({contact.transactions.length})
        </h2>
        {contact.transactions.length === 0 ? (
          <p className="text-sm italic text-nook-ink-soft">Nicio tranzacție.</p>
        ) : (
          <ul className="divide-y divide-nook-line/60">
            {contact.transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="w-24 text-xs text-nook-ink-soft shrink-0">
                  {formatDate(t.date)}
                </div>
                <div className="flex-1 font-medium text-nook-ink">
                  {REVENUE_TYPE_LABEL[t.revenueType as RevenueType]}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    t.status === "COLLECTED"
                      ? "bg-state-green/15 text-state-green"
                      : t.status === "CONFIRMED"
                        ? "bg-nook-sage/20 text-nook-forest"
                        : "bg-nook-sand/40 text-nook-ink"
                  }`}
                >
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
  tone,
}: {
  label: string;
  value: string;
  tone: "forest" | "sage" | "sand" | "line";
}) {
  const map = {
    forest: "bg-nook-forest text-nook-paper",
    sage: "bg-nook-sage/15 text-nook-ink ring-1 ring-nook-sage/30",
    sand: "bg-nook-sand/40 text-nook-ink",
    line: "bg-nook-paper-warm/60 text-nook-ink ring-1 ring-nook-line",
  };
  return (
    <div className={`rounded-2xl ${map[tone]} p-4`}>
      <div className="text-[11px] font-bold tracking-widest uppercase opacity-80">
        {label}
      </div>
      <div className="mt-1 text-sm font-display font-bold">{value}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-nook-ink">{value}</dd>
    </div>
  );
}
