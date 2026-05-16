import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconPlus } from "@/components/icons";
import {
  SUBSCRIPTION_TYPE_LABEL,
  type SubscriptionType,
} from "@/lib/domain";
import { formatDate, formatMoney } from "@/lib/format";

export default async function AbonamentePage() {
  const subs = await db.subscription.findMany({
    include: {
      contact: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
    orderBy: { purchasedAt: "desc" },
  });

  const active = subs.filter((s) => s.usedEntries < s.totalEntries);
  const consumed = subs.filter((s) => s.usedEntries >= s.totalEntries);
  const totalRevenue = subs.reduce((sum, s) => sum + s.pricePaid, 0);
  const entriesUsed = active.reduce((sum, s) => sum + s.usedEntries, 0);
  const entriesRemaining = active.reduce(
    (sum, s) => sum + (s.totalEntries - s.usedEntries),
    0,
  );

  return (
    <PageContainer>
      <PageHeader
        title="Abonamente"
        description={`${active.length} active · ${consumed.length} consumate · venit total din abonamente: ${formatMoney(totalRevenue)}`}
        action={
          <Link
            href="/abonamente/nou"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-nook-forest px-5 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink"
          >
            <IconPlus />
            Vinde abonament
          </Link>
        }
      />

      {/* Summary */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Abonamente active" value={active.length.toString()} />
        <StatCard
          label="Intrări consumate"
          value={entriesUsed.toString()}
          help="Total vizite consumate din abonamentele active"
        />
        <StatCard
          label="Intrări rămase"
          value={entriesRemaining.toString()}
          help="Venit deja recunoscut, dar vizita încă datorată"
          tone="terracotta"
        />
      </div>

      {/* Active subscriptions */}
      <h2 className="mt-8 font-display text-base font-bold text-nook-forest">
        Active ({active.length})
      </h2>
      {active.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-nook-line bg-nook-paper-warm/40 p-8 text-center">
          <p className="text-sm text-nook-ink-soft">
            Niciun abonament activ. Vinde primul abonament pentru un contact
            existent.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {active.map((s) => (
            <SubscriptionCard key={s.id} sub={s} />
          ))}
        </div>
      )}

      {/* Consumed subscriptions */}
      {consumed.length > 0 && (
        <>
          <h2 className="mt-8 font-display text-base font-bold text-nook-ink-soft">
            Consumate ({consumed.length})
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 opacity-70">
            {consumed.map((s) => (
              <SubscriptionCard key={s.id} sub={s} />
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}

function StatCard({
  label,
  value,
  help,
  tone = "sage",
}: {
  label: string;
  value: string;
  help?: string;
  tone?: "sage" | "terracotta";
}) {
  const map = {
    sage: "bg-nook-sage/10 ring-nook-sage/30",
    terracotta: "bg-nook-cream/40 ring-nook-terracotta/30",
  };
  return (
    <div className={`rounded-2xl ring-1 p-5 ${map[tone]}`}>
      <div className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold text-nook-ink">
        {value}
      </div>
      {help && <div className="mt-1 text-xs text-nook-ink-soft">{help}</div>}
    </div>
  );
}

function SubscriptionCard({
  sub,
}: {
  sub: {
    id: string;
    type: string;
    totalEntries: number;
    usedEntries: number;
    pricePaid: number;
    purchasedAt: Date;
    contact: { firstName: string; lastName: string; phone: string };
  };
}) {
  const remaining = sub.totalEntries - sub.usedEntries;
  const ratio = sub.usedEntries / sub.totalEntries;
  const almostDone = remaining <= 1;
  const done = remaining === 0;
  const tone = done ? "bg-nook-line" : almostDone ? "bg-state-yellow" : "bg-nook-sage";

  return (
    <Link
      href={`/abonamente/${sub.id}`}
      className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-5 block transition-colors hover:ring-nook-forest/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-nook-ink">
            {sub.contact.lastName} {sub.contact.firstName}
          </div>
          <div className="text-xs text-nook-ink-soft">{sub.contact.phone}</div>
        </div>
        <span className="inline-flex items-center rounded-full bg-nook-paper-warm px-2.5 py-0.5 text-[11px] font-medium text-nook-ink">
          {SUBSCRIPTION_TYPE_LABEL[sub.type as SubscriptionType]}
        </span>
      </div>

      <div className="mt-4 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-nook-ink">
          {sub.usedEntries} / {sub.totalEntries}
          <span className="ml-1 text-xs font-normal text-nook-ink-soft">
            intrări consumate
          </span>
        </span>
        <span className="text-xs text-nook-ink-soft">
          {formatMoney(sub.pricePaid)}
        </span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-nook-line/60">
        <div
          className={`h-full ${tone} transition-all`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-nook-ink-soft">
        <span>Cumpărat {formatDate(sub.purchasedAt)}</span>
        {almostDone && !done && (
          <span className="font-semibold text-state-yellow">
            Aproape consumat
          </span>
        )}
        {done && <span className="font-semibold">Consumat</span>}
      </div>
    </Link>
  );
}
