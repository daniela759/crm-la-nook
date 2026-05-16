import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconBack } from "@/components/icons";
import {
  SUBSCRIPTION_TYPE_LABEL,
  type SubscriptionType,
} from "@/lib/domain";
import { formatDate, formatMoney } from "@/lib/format";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sub = await db.subscription.findUnique({
    where: { id },
    include: {
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      transactions: { orderBy: { date: "desc" } },
    },
  });
  if (!sub) notFound();

  const remaining = sub.totalEntries - sub.usedEntries;
  const consumed = remaining <= 0;
  const ratio = sub.usedEntries / sub.totalEntries;

  return (
    <PageContainer>
      <Link
        href="/abonamente"
        className="inline-flex items-center gap-1.5 text-sm text-nook-ink-soft hover:text-nook-ink mb-4"
      >
        <IconBack />
        Înapoi la abonamente
      </Link>

      <PageHeader
        title={`Abonament · ${SUBSCRIPTION_TYPE_LABEL[sub.type as SubscriptionType]}`}
        description={`${sub.contact.lastName} ${sub.contact.firstName} · cumpărat ${formatDate(sub.purchasedAt)}`}
        action={
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              consumed
                ? "bg-nook-line text-nook-ink-soft"
                : remaining <= 1
                  ? "bg-state-yellow/15 text-state-yellow"
                  : "bg-nook-forest text-nook-paper"
            }`}
          >
            {consumed ? "Consumat" : `${remaining} intrări rămase`}
          </span>
        }
      />

      {/* Status și progres */}
      <div className="mt-6 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
              Consum intrări
            </div>
            <div className="mt-1 font-display text-3xl font-extrabold text-nook-ink">
              {sub.usedEntries} <span className="text-nook-ink-soft">/ {sub.totalEntries}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
              Plătit
            </div>
            <div className="mt-1 font-display text-2xl font-bold text-nook-forest">
              {formatMoney(sub.pricePaid)}
            </div>
          </div>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-nook-line/60">
          <div
            className={`h-full transition-all ${
              consumed ? "bg-nook-line" : remaining <= 1 ? "bg-state-yellow" : "bg-nook-sage"
            }`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>

        {/* Cele 4/8 intrări vizual */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: sub.totalEntries }, (_, i) => i < sub.usedEntries).map(
            (used, i) => (
              <span
                key={i}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold ring-1 ring-inset ${
                  used
                    ? "bg-nook-forest text-nook-paper ring-nook-forest"
                    : "bg-nook-paper text-nook-ink-soft ring-nook-line"
                }`}
                title={used ? "Intrare consumată" : "Intrare disponibilă"}
              >
                {used ? "✓" : i + 1}
              </span>
            ),
          )}
        </div>
      </div>

      {/* Detalii client */}
      <div className="mt-6 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
        <h2 className="font-display text-lg font-bold text-nook-forest mb-4">
          Deținător
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
              Nume
            </dt>
            <dd className="mt-1 text-sm">
              <Link
                href={`/contacte/${sub.contact.id}`}
                className="text-nook-forest hover:underline"
              >
                {sub.contact.lastName} {sub.contact.firstName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
              Email
            </dt>
            <dd className="mt-1 text-sm text-nook-ink">{sub.contact.email}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
              Telefon
            </dt>
            <dd className="mt-1 text-sm text-nook-ink">{sub.contact.phone}</dd>
          </div>
        </dl>
      </div>

      {/* Tranzacții */}
      <div className="mt-6 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-6">
        <h2 className="font-display text-lg font-bold text-nook-forest mb-4">
          Tranzacții asociate ({sub.transactions.length})
        </h2>
        {sub.transactions.length === 0 ? (
          <p className="text-sm italic text-nook-ink-soft">
            Nicio tranzacție directă (intrările consumate ulterior nu generează tranzacții — sunt acoperite prin plata abonamentului).
          </p>
        ) : (
          <ul className="divide-y divide-nook-line/60">
            {sub.transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="w-24 text-xs text-nook-ink-soft shrink-0">
                  {formatDate(t.date)}
                </div>
                <div className="flex-1 font-medium text-nook-ink">
                  Vânzare abonament
                </div>
                <span className="rounded-full bg-state-green/15 px-2 py-0.5 text-[10px] font-medium text-state-green">
                  Încasat
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
