"use client";

import { useActionState } from "react";
import {
  addInterest,
  addLeadSource,
  toggleInterest,
  toggleLeadSource,
  updatePrices,
  updateScoreRules,
  updateSchedule,
  updateTargets,
  type ActionState,
} from "./actions";
import type {
  Prices,
  Schedule,
  ScoreRules,
  Targets,
} from "@/lib/settings";

const empty: ActionState = {};

// ─── Card pentru fiecare grup ─────────────────────────────────────────────
function Card({
  title,
  description,
  state,
  children,
}: {
  title: string;
  description?: string;
  state: ActionState;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-5">
      <h3 className="font-display text-base font-bold text-nook-forest">{title}</h3>
      {description && (
        <p className="mt-1 mb-4 text-xs text-nook-ink-soft">{description}</p>
      )}
      {state.error && (
        <div className="mb-3 rounded-xl bg-state-red/10 px-3 py-2 text-xs text-state-red ring-1 ring-state-red/30">
          {state.error}
        </div>
      )}
      {state.ok && (
        <div className="mb-3 rounded-xl bg-state-green/10 px-3 py-2 text-xs text-state-green ring-1 ring-state-green/30">
          Salvat
        </div>
      )}
      {children}
    </div>
  );
}

function NumField({
  label,
  name,
  defaultValue,
  suffix,
  min,
}: {
  label: string;
  name: string;
  defaultValue: number;
  suffix?: string;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-nook-ink-soft">{label}</span>
      <div className="relative mt-1">
        <input
          name={name}
          type="number"
          defaultValue={defaultValue}
          min={min}
          className="w-full rounded-xl border border-nook-line bg-nook-paper px-3 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-nook-ink-soft">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function TimeField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-nook-ink-soft">{label}</span>
      <input
        name={name}
        type="time"
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-3 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
      />
    </label>
  );
}

function SaveBtn({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center rounded-full bg-nook-forest px-5 text-xs font-medium text-nook-paper hover:bg-nook-ink disabled:opacity-60"
    >
      {pending ? "Se salvează…" : "Salvează"}
    </button>
  );
}

// ─── Form prețuri ────────────────────────────────────────────────────────
export function PricesForm({ prices }: { prices: Prices }) {
  const [state, action, pending] = useActionState(updatePrices, empty);
  return (
    <Card title="Prețuri (lei)" description="Tarife folosite la calcul valoare estimată." state={state}>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <NumField label="Vizită copil" name="childVisit" defaultValue={prices.childVisit} suffix="lei" min={0} />
        <NumField label="Vizită părinte" name="parentVisit" defaultValue={prices.parentVisit} suffix="lei" min={0} />
        <NumField label="Zi de naștere (3h)" name="birthday" defaultValue={prices.birthday} suffix="lei" min={0} />
        <NumField label="Taxă eveniment" name="eventFee" defaultValue={prices.eventFee} suffix="lei" min={0} />
        <NumField label="Abonament 8 intrări" name="subscription8" defaultValue={prices.subscription8} suffix="lei" min={0} />
        <NumField label="Abonament 4 intrări" name="subscription4" defaultValue={prices.subscription4} suffix="lei" min={0} />
        <div className="sm:col-span-2 flex justify-end pt-2">
          <SaveBtn pending={pending} />
        </div>
      </form>
    </Card>
  );
}

// ─── Form targete ────────────────────────────────────────────────────────
export function TargetsForm({ targets }: { targets: Targets }) {
  const [state, action, pending] = useActionState(updateTargets, empty);
  return (
    <Card
      title="Targete financiare (lei / lună)"
      description="Pragurile semaforului: sub minim = roșu, sub break-even = galben, sub profitabilitate = verde, peste = verde-aprins."
      state={state}
    >
      <form action={action} className="grid gap-3 sm:grid-cols-3">
        <NumField label="Prag minim supraviețuire" name="survival" defaultValue={targets.survival} suffix="lei" min={0} />
        <NumField label="Break-even" name="breakEven" defaultValue={targets.breakEven} suffix="lei" min={0} />
        <NumField label="Profitabilitate" name="profitability" defaultValue={targets.profitability} suffix="lei" min={0} />
        <div className="sm:col-span-3 flex justify-end pt-2">
          <SaveBtn pending={pending} />
        </div>
      </form>
    </Card>
  );
}

// ─── Form program ────────────────────────────────────────────────────────
export function ScheduleForm({ schedule }: { schedule: Schedule }) {
  const [state, action, pending] = useActionState(updateSchedule, empty);
  return (
    <Card title="Program de funcționare" state={state}>
      <form action={action} className="space-y-4">
        <div>
          <div className="mb-2 text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
            Luni–Vineri
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <TimeField label="Dim. start" name="weekdayMorningStart" defaultValue={schedule.weekday[0].start} />
            <TimeField label="Dim. final" name="weekdayMorningEnd" defaultValue={schedule.weekday[0].end} />
            <TimeField label="După-am. start" name="weekdayAfternoonStart" defaultValue={schedule.weekday[1].start} />
            <TimeField label="După-am. final" name="weekdayAfternoonEnd" defaultValue={schedule.weekday[1].end} />
          </div>
        </div>
        <div>
          <div className="mb-2 text-[11px] font-bold tracking-widest uppercase text-nook-ink-soft">
            Weekend
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TimeField label="Start" name="weekendStart" defaultValue={schedule.weekend[0].start} />
            <TimeField label="Final" name="weekendEnd" defaultValue={schedule.weekend[0].end} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 border-t border-nook-line pt-4">
          <NumField label="Durată zi de naștere" name="birthdayDurationHours" defaultValue={schedule.birthdayDurationHours} suffix="ore" min={1} />
          <NumField label="Capacitate slot standard" name="slotCapacity" defaultValue={schedule.slotCapacity} suffix="copii" min={1} />
        </div>
        <div className="flex justify-end pt-2">
          <SaveBtn pending={pending} />
        </div>
      </form>
    </Card>
  );
}

// ─── Form scor ──────────────────────────────────────────────────────────
export function ScoreRulesForm({ rules }: { rules: ScoreRules }) {
  const [state, action, pending] = useActionState(updateScoreRules, empty);
  return (
    <Card
      title="Reguli scor comportamental"
      description="Punctaje acordate la fiecare acțiune. Negative permis pentru no-show și inactivitate. Pragul declanșează taskul de ofertă abonament."
      state={state}
    >
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <NumField label="Rezervare făcută" name="booking" defaultValue={rules.booking} />
        <NumField label="Rezervare confirmată" name="confirmed" defaultValue={rules.confirmed} />
        <NumField label="Vizită efectivă" name="visit" defaultValue={rules.visit} />
        <NumField label="A 2-a vizită < 30 zile (bonus)" name="secondVisitWithin30d" defaultValue={rules.secondVisitWithin30d} />
        <NumField label="Participare eveniment" name="eventAttendance" defaultValue={rules.eventAttendance} />
        <NumField label="Zi de naștere organizată" name="birthdayHeld" defaultValue={rules.birthdayHeld} />
        <NumField label="Interes abonament (manual)" name="subscriptionInterest" defaultValue={rules.subscriptionInterest} />
        <NumField label="No-show" name="noShow" defaultValue={rules.noShow} />
        <NumField label="Inactivitate 60+ zile" name="inactivity60d" defaultValue={rules.inactivity60d} />
        <NumField label="Prag „Pregătit abonament”" name="threshold" defaultValue={rules.threshold} min={0} />
        <div className="sm:col-span-2 flex justify-end pt-2">
          <SaveBtn pending={pending} />
        </div>
      </form>
    </Card>
  );
}

// ─── Liste (sources / interests) ─────────────────────────────────────────
export function ListEditor({
  title,
  description,
  items,
  addAction,
  toggleAction,
}: {
  title: string;
  description: string;
  items: Array<{ id: string; name: string; active: boolean }>;
  addAction: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  toggleAction: (fd: FormData) => Promise<void>;
}) {
  const [state, action, pending] = useActionState(addAction, empty);
  return (
    <Card title={title} description={description} state={state}>
      <form action={action} className="flex gap-2">
        <input
          name="name"
          type="text"
          placeholder="Nume nou…"
          required
          className="flex-1 rounded-xl border border-nook-line bg-nook-paper px-3 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-nook-forest px-4 text-xs font-medium text-nook-paper hover:bg-nook-ink disabled:opacity-60"
        >
          + Adaugă
        </button>
      </form>

      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((it) => (
          <li key={it.id}>
            <form action={toggleAction}>
              <input type="hidden" name="id" value={it.id} />
              <button
                type="submit"
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  it.active
                    ? "bg-nook-sage-light/60 text-nook-forest hover:bg-nook-sage/40"
                    : "bg-nook-line text-nook-ink-soft line-through hover:bg-nook-paper-warm"
                }`}
                title={it.active ? "Click ca să dezactivezi" : "Click ca să reactivezi"}
              >
                {it.name}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function LeadSourcesEditor({
  items,
}: {
  items: Array<{ id: string; name: string; active: boolean }>;
}) {
  return (
    <ListEditor
      title="Surse de lead"
      description="De unde aud părinții despre Nook. Click pe nume ca să activezi/dezactivezi (istoricul se păstrează)."
      items={items}
      addAction={addLeadSource}
      toggleAction={toggleLeadSource}
    />
  );
}

export function InterestsEditor({
  items,
}: {
  items: Array<{ id: string; name: string; active: boolean }>;
}) {
  return (
    <ListEditor
      title="Interese copii"
      description="Etichete pentru segmentarea copiilor. Folosite la propunerea evenimentelor potrivite."
      items={items}
      addAction={addInterest}
      toggleAction={toggleInterest}
    />
  );
}
