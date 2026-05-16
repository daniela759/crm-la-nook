import type { LeadType } from "@/lib/domain";
import type { Prices } from "@/lib/settings";

/**
 * Calculează valoarea estimată a unui lead pe baza tipului și a participanților.
 * - VISIT: nr copii × preț vizită copil + nr adulți × preț vizită părinte
 * - BIRTHDAY: tarif fix închiriere spațiu 3h
 * - EVENT: taxă fixă per participare (lead-ul reprezintă o înscriere)
 * - SUBSCRIPTION_INTEREST: 0 (e doar interes, nu generează venit direct)
 */
export function estimateLeadValue({
  type,
  childrenCount,
  adultsCount,
  prices,
  fromSubscription = false,
}: {
  type: LeadType;
  childrenCount: number;
  adultsCount: number;
  prices: Prices;
  /** Dacă vizita se consumă dintr-un abonament activ, valoarea încasată e 0 */
  fromSubscription?: boolean;
}): number {
  switch (type) {
    case "VISIT":
      if (fromSubscription) {
        // Doar adulții se plătesc; copiii consumă intrările
        return adultsCount * prices.parentVisit;
      }
      return childrenCount * prices.childVisit + adultsCount * prices.parentVisit;
    case "BIRTHDAY":
      return prices.birthday;
    case "EVENT":
      return prices.eventFee;
    case "SUBSCRIPTION_INTEREST":
      return 0;
  }
}
