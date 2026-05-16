import {
  LEAD_STATUS_LABEL,
  LEAD_TYPE_LABEL,
  type LeadStatus,
  type LeadType,
} from "@/lib/domain";

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-nook-sand/40 text-nook-ink ring-nook-sand",
  CONTACTED: "bg-nook-sage-light/50 text-nook-ink ring-nook-sage-light",
  CONFIRMED: "bg-nook-sage/30 text-nook-forest ring-nook-sage/60",
  PRESENT: "bg-nook-forest text-nook-paper ring-nook-forest",
  ABSENT: "bg-state-red/15 text-state-red ring-state-red/40",
  CANCELLED: "bg-nook-line text-nook-ink-soft ring-nook-line",
};

export function StatusBadge({ status }: { status: string }) {
  const s = status as LeadStatus;
  const style = STATUS_STYLES[s] ?? STATUS_STYLES.CANCELLED;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${style}`}
    >
      {LEAD_STATUS_LABEL[s] ?? status}
    </span>
  );
}

const TYPE_STYLES: Record<LeadType, string> = {
  VISIT: "bg-nook-paper-warm text-nook-ink",
  BIRTHDAY: "bg-nook-cream text-nook-terracotta",
  EVENT: "bg-nook-sage-light/40 text-nook-forest",
  SUBSCRIPTION_INTEREST: "bg-nook-forest/10 text-nook-forest",
};

export function TypeBadge({ type }: { type: string }) {
  const t = type as LeadType;
  const style = TYPE_STYLES[t] ?? TYPE_STYLES.VISIT;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style}`}
    >
      {LEAD_TYPE_LABEL[t] ?? type}
    </span>
  );
}
