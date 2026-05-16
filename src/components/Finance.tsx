import { formatMoney } from "@/lib/format";
import {
  TARGET_HELP,
  TARGET_LABEL,
  targetStatus,
  type TargetTone,
} from "@/lib/finance";
import type { Targets } from "@/lib/settings";

const TONE_CLASSES: Record<
  TargetTone,
  { bar: string; bg: string; ring: string; text: string; dot: string }
> = {
  RED: {
    bar: "bg-state-red",
    bg: "bg-state-red/10",
    ring: "ring-state-red/40",
    text: "text-state-red",
    dot: "bg-state-red",
  },
  YELLOW: {
    bar: "bg-state-yellow",
    bg: "bg-state-yellow/15",
    ring: "ring-state-yellow/40",
    text: "text-state-yellow",
    dot: "bg-state-yellow",
  },
  GREEN: {
    bar: "bg-state-green",
    bg: "bg-state-green/15",
    ring: "ring-state-green/40",
    text: "text-state-green",
    dot: "bg-state-green",
  },
  GREEN_BRIGHT: {
    bar: "bg-state-green-bright",
    bg: "bg-state-green-bright/15",
    ring: "ring-state-green-bright/40",
    text: "text-state-green-bright",
    dot: "bg-state-green-bright",
  },
};

/**
 * Card semafor pentru target — afișează venitul curent comparat cu cele 3 praguri.
 * Bar de progres cu marcaje la 18k / 30k / 50k.
 */
export function TargetSemafor({
  amount,
  targets,
  title = "Venit lună curentă",
  subtitle,
}: {
  amount: number;
  targets: Targets;
  title?: string;
  subtitle?: string;
}) {
  const tone = targetStatus(amount, targets);
  const classes = TONE_CLASSES[tone];
  const max = Math.max(targets.profitability * 1.1, amount * 1.05);
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`;

  return (
    <div className={`rounded-2xl ${classes.bg} ring-1 ${classes.ring} p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
            {title}
          </div>
          <div className="mt-1 font-display text-4xl font-extrabold text-nook-ink">
            {formatMoney(amount)}
          </div>
          {subtitle && (
            <div className="mt-1 text-xs text-nook-ink-soft">{subtitle}</div>
          )}
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full bg-nook-paper px-3 py-1 text-xs font-semibold ${classes.text} ring-1 ring-inset ${classes.ring}`}
          >
            <span className={`h-2 w-2 rounded-full ${classes.dot}`} />
            {TARGET_LABEL[tone]}
          </span>
          <div className="mt-1 max-w-[14rem] text-[11px] text-nook-ink-soft">
            {TARGET_HELP[tone]}
          </div>
        </div>
      </div>

      {/* Bar de progres cu trei praguri */}
      <div className="relative mt-6 h-2 w-full overflow-hidden rounded-full bg-nook-line/60">
        <div
          className={`h-full ${classes.bar} transition-all`}
          style={{ width: pct(amount) }}
        />
        {/* Marker-uri praguri */}
        {[targets.survival, targets.breakEven, targets.profitability].map((t) => (
          <div
            key={t}
            className="absolute top-0 h-2 w-px bg-nook-ink/40"
            style={{ left: pct(t) }}
          />
        ))}
      </div>
      <div className="relative mt-1 text-[10px] text-nook-ink-soft">
        {[
          { value: targets.survival, label: "18k · minim" },
          { value: targets.breakEven, label: "30k · break-even" },
          { value: targets.profitability, label: "50k · profit" },
        ].map((t) => (
          <span
            key={t.value}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: pct(t.value) }}
          >
            {t.label}
          </span>
        ))}
        {/* Spacer pentru înălțime */}
        <span className="invisible">x</span>
      </div>
    </div>
  );
}

/**
 * Card pâlnie pe 3 niveluri (Încasat / Confirmat / Potențial).
 * Fiecare nivel cu propria culoare de încredere.
 */
export function FunnelCards({
  collected,
  confirmed,
  potential,
}: {
  collected: number;
  confirmed: number;
  potential: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FunnelCard
        title="Încasat"
        amount={collected}
        tone="green"
        description="Bani efectiv primiți"
      />
      <FunnelCard
        title="Confirmat"
        amount={confirmed}
        tone="sage"
        description="Rezervări confirmate, încă neonorate"
      />
      <FunnelCard
        title="Potențial"
        amount={potential}
        tone="terracotta"
        description="Rezervări noi, neconfirmate"
      />
    </div>
  );
}

function FunnelCard({
  title,
  amount,
  tone,
  description,
}: {
  title: string;
  amount: number;
  tone: "green" | "sage" | "terracotta";
  description: string;
}) {
  const map = {
    green: "bg-nook-forest text-nook-paper",
    sage: "bg-nook-sage text-nook-paper",
    terracotta: "bg-nook-cream text-nook-terracotta",
  } as const;
  return (
    <div className={`rounded-2xl ${map[tone]} p-5`}>
      <div className="text-[11px] font-bold tracking-widest uppercase opacity-80">
        {title}
      </div>
      <div className="mt-2 font-display text-3xl font-extrabold">
        {formatMoney(amount)}
      </div>
      <div className="mt-1 text-xs opacity-80">{description}</div>
    </div>
  );
}

/**
 * Bar simplu pentru defalcări — un rând cu label, sumă, bar proporțional.
 */
export function BreakdownList({
  items,
  emptyText = "Nicio încasare în această perioadă.",
}: {
  items: Array<{ key: string; label: string; amount: number; count: number }>;
  emptyText?: string;
}) {
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  if (total === 0) {
    return (
      <p className="text-sm italic text-nook-ink-soft">{emptyText}</p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const pct = total > 0 ? (item.amount / total) * 100 : 0;
        return (
          <li key={item.key}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-nook-ink">{item.label}</span>
              <span className="font-semibold text-nook-ink">
                {formatMoney(item.amount)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-nook-line/60">
                <div
                  className="h-full bg-nook-sage transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-12 text-right text-[10px] text-nook-ink-soft">
                {pct.toFixed(0)}%
              </span>
            </div>
            {item.count > 0 && (
              <div className="mt-0.5 text-[10px] text-nook-ink-soft">
                {item.count} {item.count === 1 ? "tranzacție" : "tranzacții"}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
