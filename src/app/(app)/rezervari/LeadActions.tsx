import { confirmLead, markPresent, markAbsent, cancelLead } from "./actions";
import type { LeadStatus } from "@/lib/domain";

/**
 * Buton-uri inline de tranziție status. Server Components — fiecare buton e
 * un mini-form care invocă un Server Action.
 *
 * Reguli de afișare bazate pe status:
 *  - NEW       → Confirmă · Anulează
 *  - CONTACTED → Confirmă · Anulează
 *  - CONFIRMED → Prezent · Absent · Anulează
 *  - PRESENT   → (nimic — final)
 *  - ABSENT    → (nimic — final, taskul de recuperare e generat)
 *  - CANCELLED → (nimic)
 */
export function LeadActions({
  leadId,
  status,
  editable = true,
}: {
  leadId: string;
  status: string;
  editable?: boolean;
}) {
  const s = status as LeadStatus;

  const canConfirm = s === "NEW" || s === "CONTACTED";
  const canMarkOutcome = s === "CONFIRMED" || s === "NEW" || s === "CONTACTED";
  const canCancel = s !== "PRESENT" && s !== "ABSENT" && s !== "CANCELLED";

  // Cont doar-citire (marketing) sau status final → fără butoane.
  if (!editable || s === "PRESENT" || s === "ABSENT" || s === "CANCELLED") {
    return <span className="text-xs italic text-nook-ink-soft">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {canConfirm && (
        <ActionButton action={confirmLead} leadId={leadId} variant="primary">
          Confirmă
        </ActionButton>
      )}
      {canMarkOutcome && (
        <>
          <ActionButton action={markPresent} leadId={leadId} variant="success">
            Prezent
          </ActionButton>
          <ActionButton action={markAbsent} leadId={leadId} variant="danger">
            Absent
          </ActionButton>
        </>
      )}
      {canCancel && (
        <ActionButton action={cancelLead} leadId={leadId} variant="ghost">
          Anulează
        </ActionButton>
      )}
    </div>
  );
}

type Variant = "primary" | "success" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-nook-sage text-nook-paper hover:bg-nook-forest",
  success: "bg-nook-forest text-nook-paper hover:bg-nook-ink",
  danger: "bg-state-red/10 text-state-red hover:bg-state-red/20",
  ghost: "text-nook-ink-soft hover:text-nook-ink hover:bg-nook-paper-warm",
};

function ActionButton({
  action,
  leadId,
  variant,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  leadId: string;
  variant: Variant;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="leadId" value={leadId} />
      <button
        type="submit"
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${VARIANT_CLASSES[variant]}`}
      >
        {children}
      </button>
    </form>
  );
}
