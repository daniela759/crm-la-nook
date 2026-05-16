import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconPlus, IconArrowRight } from "@/components/icons";
import { getSettings } from "@/lib/settings";
import { computeScore, computeStage, scoreTone, SCORE_TONE_LABEL } from "@/lib/scoring";
import { PIPELINE_STAGE_LABEL, type PipelineStage } from "@/lib/domain";

function ageFromBirthDate(birth: Date): number {
  const today = new Date(2026, 4, 16); // referință luna demo
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

type SearchParams = Promise<{ q?: string }>;

export default async function ContactePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where = query
    ? {
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ],
      }
    : undefined;

  const [contactsRaw, totalAll, settings] = await Promise.all([
    db.contact.findMany({
      where,
      include: {
        children: { orderBy: { birthDate: "asc" } },
        initialSource: true,
        leads: { select: { type: true, status: true, scheduledAt: true, createdAt: true } },
        subscriptions: { select: { totalEntries: true, usedEntries: true, purchasedAt: true } },
        _count: { select: { leads: true, subscriptions: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.contact.count(),
    getSettings(),
  ]);

  const referenceDate = new Date(2026, 4, 16); // consistent cu seed
  const contacts = contactsRaw.map((c) => {
    const score = computeScore(
      { leads: c.leads, subscriptions: c.subscriptions, referenceDate },
      settings.scoreRules,
    );
    const stage = computeStage(
      { leads: c.leads, subscriptions: c.subscriptions, referenceDate },
      score,
      settings.scoreRules,
    );
    return { ...c, score, stage };
  });

  return (
    <PageContainer>
      <PageHeader
        title="Contacte"
        description={`${totalAll} ${totalAll === 1 ? "părinte / aparținător" : "părinți / aparținători"} în baza de date.`}
        action={
          <Link
            href="/contacte/nou"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-nook-forest px-5 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink"
          >
            <IconPlus />
            Contact nou
          </Link>
        }
      />

      {/* Bara de căutare */}
      <form className="mt-6 flex gap-2" action="/contacte">
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Caută după nume, email sau telefon…"
          className="flex-1 rounded-full border border-nook-line bg-nook-paper px-5 py-2.5 text-sm placeholder:text-nook-ink-soft/60 focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
        {query && (
          <Link
            href="/contacte"
            className="inline-flex items-center px-4 text-sm text-nook-ink-soft hover:text-nook-ink"
          >
            Resetează
          </Link>
        )}
      </form>

      {/* Listă */}
      {contacts.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-nook-paper ring-1 ring-nook-line">
          <table className="w-full">
            <thead className="border-b border-nook-line bg-nook-paper-warm/50 text-left text-[11px] font-semibold uppercase tracking-wider text-nook-ink-soft">
              <tr>
                <th className="px-5 py-3">Părinte</th>
                <th className="px-5 py-3">Copii</th>
                <th className="px-5 py-3 hidden md:table-cell">Stadiu</th>
                <th className="px-5 py-3 hidden lg:table-cell">Sursă</th>
                <th className="px-5 py-3 hidden lg:table-cell text-center">Scor</th>
                <th className="px-5 py-3 hidden xl:table-cell">Înregistrat</th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nook-line/60">
              {contacts.map((c) => (
                <tr key={c.id} className="group hover:bg-nook-paper-warm/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-nook-ink">
                      {c.lastName} {c.firstName}
                    </div>
                    <div className="text-xs text-nook-ink-soft">{c.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    {c.children.length === 0 ? (
                      <span className="text-xs italic text-nook-ink-soft">
                        — fără copii
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {c.children.map((ch) => (
                          <span
                            key={ch.id}
                            className="inline-flex items-center rounded-full bg-nook-sage-light/50 px-2.5 py-0.5 text-xs text-nook-ink"
                          >
                            {ch.name} · {ageFromBirthDate(ch.birthDate)}a
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <StageBadge stage={c.stage} />
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-sm text-nook-ink-soft">
                    {c.initialSource?.name ?? "—"}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-center">
                    <ScoreBadge score={c.score} />
                  </td>
                  <td className="px-5 py-4 hidden xl:table-cell text-xs text-nook-ink-soft">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className="inline-flex items-center text-nook-ink-soft group-hover:text-nook-forest transition-colors"
                      aria-hidden
                    >
                      <IconArrowRight />
                    </span>
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

function ScoreBadge({ score }: { score: number }) {
  const tone = scoreTone(score);
  const map = {
    cold: "bg-nook-line text-nook-ink-soft",
    warm: "bg-nook-sand/50 text-nook-ink",
    ready: "bg-nook-forest text-nook-paper",
    ambassador: "bg-nook-terracotta text-nook-paper",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[tone]}`}
      title={SCORE_TONE_LABEL[tone]}
    >
      {score}
    </span>
  );
}

const STAGE_TONE: Record<PipelineStage, string> = {
  LEAD_NEW: "bg-nook-sand/40 text-nook-ink",
  CONFIRMED_RESERVATION: "bg-nook-sage/30 text-nook-forest",
  FIRST_VISIT: "bg-nook-sage-light/60 text-nook-forest",
  RECURRING_VISITOR: "bg-nook-sage/50 text-nook-paper",
  READY_FOR_SUBSCRIPTION: "bg-nook-terracotta/20 text-nook-terracotta",
  SUBSCRIBED: "bg-nook-forest text-nook-paper",
  LOYAL_SUBSCRIBER: "bg-nook-terracotta text-nook-paper",
  NO_SHOW: "bg-state-red/15 text-state-red",
  INACTIVE: "bg-nook-line text-nook-ink-soft",
};

function StageBadge({ stage }: { stage: PipelineStage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STAGE_TONE[stage]}`}
    >
      {PIPELINE_STAGE_LABEL[stage]}
    </span>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-nook-line bg-nook-paper-warm/50 p-12 text-center">
      <h3 className="font-display text-xl font-bold text-nook-forest">
        {query ? "Niciun rezultat" : "Niciun contact încă"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-nook-ink-soft">
        {query
          ? `Nimic nu se potrivește cu „${query}". Încearcă alt termen sau resetează căutarea.`
          : "Adaugă primul părinte ca să începi. Copiii lui și rezervările se vor lega de aici."}
      </p>
      {!query && (
        <Link
          href="/contacte/nou"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-nook-forest px-5 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink"
        >
          <IconPlus />
          Adaugă primul contact
        </Link>
      )}
    </div>
  );
}
