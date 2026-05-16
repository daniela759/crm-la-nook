import Link from "next/link";
import type { EnrichedSlot } from "@/lib/calendar";
import { formatTime } from "@/lib/format";

/**
 * Card pentru un slot dintr-o zi a calendarului.
 * Trei stări vizuale:
 *  - BLOCAT (zi de naștere sau eveniment) → background contrastant + label
 *  - PLIN (capacitate consumată) → bar capacitate roșu + warning
 *  - DISPONIBIL → bar verde proporțional
 */
export function SlotCard({ slot }: { slot: EnrichedSlot }) {
  if (slot.blocked) {
    const isBirthday = slot.blocked.type === "BIRTHDAY";
    const bg = isBirthday
      ? "bg-nook-cream ring-nook-terracotta/40"
      : "bg-nook-sage-light/40 ring-nook-sage/50";
    const label = isBirthday ? "Zi de naștere" : "Eveniment";
    const tone = isBirthday ? "text-nook-terracotta" : "text-nook-forest";

    return (
      <div className={`rounded-xl ${bg} ring-1 ring-inset p-3`}>
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-semibold text-nook-ink-soft">
            {slot.startTime}–{slot.endTime}
          </span>
          <span className={`text-[10px] font-bold tracking-widest uppercase ${tone}`}>
            {label}
          </span>
        </div>
        <div className="mt-1 text-sm font-semibold text-nook-ink">
          {slot.blocked.lead.contact.lastName} {slot.blocked.lead.contact.firstName}
        </div>
        {isBirthday && (
          <div className="mt-0.5 text-[11px] text-nook-ink-soft">
            Blochează spațiul 3h
          </div>
        )}
        <div className="mt-1 text-[10px] uppercase tracking-wider text-nook-ink-soft">
          Spațiu blocat
        </div>
      </div>
    );
  }

  const ratio = slot.capacity > 0 ? slot.childrenBooked / slot.capacity : 0;
  const full = ratio >= 1;
  const almostFull = ratio >= 0.75;
  const barColor = full
    ? "bg-state-red"
    : almostFull
      ? "bg-state-yellow"
      : "bg-nook-sage";

  return (
    <div className="rounded-xl bg-nook-paper ring-1 ring-nook-line p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold text-nook-ink-soft">
          {slot.startTime}–{slot.endTime}
        </span>
        <span className="text-[10px] font-semibold text-nook-ink-soft">
          {slot.childrenBooked}/{slot.capacity}
        </span>
      </div>

      {/* Bar de capacitate */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-nook-line/60">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>

      {/* Listă rezervări */}
      {slot.leads.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {slot.leads.map((l) => (
            <li
              key={l.id}
              className="flex items-baseline justify-between gap-2 text-xs"
            >
              <span className="truncate text-nook-ink">
                {l.contact.lastName} {l.contact.firstName}
              </span>
              <span className="shrink-0 text-[10px] text-nook-ink-soft">
                {l.children.length === 1
                  ? "1 copil"
                  : `${l.children.length} copii`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 text-[11px] italic text-nook-ink-soft">
          Slot liber
        </div>
      )}
    </div>
  );
}

export function OutOfScheduleCard({
  leads,
}: {
  leads: Array<{
    id: string;
    type: string;
    scheduledAt: Date;
    contact: { firstName: string; lastName: string };
    children: { child: { name: string } }[];
  }>;
}) {
  if (leads.length === 0) return null;
  return (
    <div className="mt-2 rounded-xl border border-dashed border-nook-line p-3">
      <span className="text-[10px] font-bold tracking-widest uppercase text-nook-terracotta">
        În afara programului
      </span>
      <ul className="mt-1.5 space-y-1">
        {leads.map((l) => (
          <li key={l.id} className="flex items-baseline justify-between text-xs">
            <span className="text-nook-ink">
              {l.contact.lastName} {l.contact.firstName}
            </span>
            <span className="text-[10px] text-nook-ink-soft">
              {formatTime(l.scheduledAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
