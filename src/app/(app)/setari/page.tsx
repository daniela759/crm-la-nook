import { db } from "@/lib/db";
import {
  PageContainer,
  PageHeader,
} from "@/components/PageHeader";
import {
  DEFAULT_PRICES,
  DEFAULT_SCHEDULE,
  DEFAULT_SCORE_RULES,
  DEFAULT_TARGETS,
} from "@/lib/domain";

export default async function SetariPage() {
  const settings = await db.settings.findUnique({ where: { id: 1 } });

  const prices = settings ? JSON.parse(settings.prices) : DEFAULT_PRICES;
  const targets = settings ? JSON.parse(settings.targets) : DEFAULT_TARGETS;
  const schedule = settings ? JSON.parse(settings.schedule) : DEFAULT_SCHEDULE;
  const scoreRules = settings ? JSON.parse(settings.scoreRules) : DEFAULT_SCORE_RULES;

  return (
    <PageContainer>
      <PageHeader
        title="Setări"
        description="Configurarea afacerii — prețuri, program, targete financiare, reguli de scor. Vizualizare doar pentru moment; editarea vine în Etapa 5."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <SettingsCard title="Prețuri (lei)">
          <Row label="Vizită copil" value={prices.childVisit} />
          <Row label="Vizită părinte" value={prices.parentVisit} />
          <Row label="Zi de naștere (3h)" value={prices.birthday} />
          <Row label="Taxă eveniment" value={prices.eventFee} />
          <Row label="Abonament 8 intrări" value={prices.subscription8} />
          <Row label="Abonament 4 intrări" value={prices.subscription4} />
        </SettingsCard>

        <SettingsCard title="Targete financiare (lei / lună)">
          <Row label="Prag minim supraviețuire" value={targets.survival} tone="red" />
          <Row label="Break-even" value={targets.breakEven} tone="yellow" />
          <Row label="Profitabilitate" value={targets.profitability} tone="green" />
        </SettingsCard>

        <SettingsCard title="Program de funcționare">
          <Row label="Luni–Vineri (dimineață)" value={`${schedule.weekday[0].start} – ${schedule.weekday[0].end}`} />
          <Row label="Luni–Vineri (după-amiaza)" value={`${schedule.weekday[1].start} – ${schedule.weekday[1].end}`} />
          <Row label="Weekend" value={`${schedule.weekend[0].start} – ${schedule.weekend[0].end}`} />
          <Row label="Durată zi de naștere" value={`${schedule.birthdayDurationHours} ore`} />
          <Row label="Capacitate slot" value={`${schedule.slotCapacity} copii`} />
        </SettingsCard>

        <SettingsCard title="Scor comportamental">
          <Row label="Rezervare" value={`+${scoreRules.booking}`} />
          <Row label="Confirmare" value={`+${scoreRules.confirmed}`} />
          <Row label="Vizită" value={`+${scoreRules.visit}`} />
          <Row label="Eveniment" value={`+${scoreRules.eventAttendance}`} />
          <Row label="Zi de naștere" value={`+${scoreRules.birthdayHeld}`} />
          <Row label="No-show" value={`${scoreRules.noShow}`} tone="red" />
          <Row label="Prag „Pregătit abonament”" value={scoreRules.threshold} tone="green" />
        </SettingsCard>
      </div>
    </PageContainer>
  );
}

function SettingsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-5">
      <h3 className="font-display text-base font-bold text-nook-forest">{title}</h3>
      <dl className="mt-3 flex flex-col divide-y divide-nook-line/50">{children}</dl>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "red" | "yellow" | "green";
}) {
  const toneClass = {
    red: "text-state-red",
    yellow: "text-state-yellow",
    green: "text-state-green-bright",
  };
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <dt className="text-nook-ink-soft">{label}</dt>
      <dd className={`font-semibold ${tone ? toneClass[tone] : "text-nook-ink"}`}>
        {value}
      </dd>
    </div>
  );
}
