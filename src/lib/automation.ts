/**
 * Reguli auto-generate task-uri (spec sec. 8.3).
 *
 * Rulează:
 *  - Manual prin Server Action „Rulează automatizările" (buton pe /taskuri)
 *  - În producție: cron zilnic la ~07:30 prin Vercel Cron
 *
 * Toate regulile sunt idempotente: verifică dacă există deja un task
 * pentru aceeași entitate / tip înainte de a crea unul nou.
 */
import { db } from "@/lib/db";
import { TASK_TYPE_DEFAULT_CATEGORY } from "@/lib/domain";
import { getSettings } from "@/lib/settings";
import { computeScore, computeStage } from "@/lib/scoring";

export type AutomationResult = {
  confirmReservations: number;
  offerSubscription: number;
  renewSubscription: number;
  inactivityRevival: number;
};

export async function runAutomations(now = new Date()): Promise<AutomationResult> {
  const settings = await getSettings();
  const result: AutomationResult = {
    confirmReservations: 0,
    offerSubscription: 0,
    renewSubscription: 0,
    inactivityRevival: 0,
  };

  // ─── 1. Lead-uri NEW > 24h → „Confirmă rezervarea" ───────────────────────
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const staleLeads = await db.lead.findMany({
    where: {
      status: "NEW",
      createdAt: { lt: cutoff24h },
    },
    include: { contact: true },
  });
  for (const lead of staleLeads) {
    const exists = await db.task.findFirst({
      where: {
        leadId: lead.id,
        type: "CONFIRM_RESERVATION",
        status: { in: ["NEW", "IN_PROGRESS"] },
      },
    });
    if (exists) continue;
    await db.task.create({
      data: {
        title: `Confirmă rezervarea — ${lead.contact.lastName} ${lead.contact.firstName}`,
        type: "CONFIRM_RESERVATION",
        category: TASK_TYPE_DEFAULT_CATEGORY.CONFIRM_RESERVATION,
        contactId: lead.contactId,
        leadId: lead.id,
        dueDate: now,
        priority: "HIGH",
        status: "NEW",
        origin: "AUTO",
      },
    });
    result.confirmReservations++;
  }

  // ─── 2. Contacte „Pregătite pt. abonament" → „Oferă abonament" ───────────
  const contacts = await db.contact.findMany({
    include: {
      leads: { select: { type: true, status: true, scheduledAt: true, createdAt: true } },
      subscriptions: { select: { totalEntries: true, usedEntries: true, purchasedAt: true } },
    },
  });

  for (const c of contacts) {
    const score = computeScore(
      { leads: c.leads, subscriptions: c.subscriptions, referenceDate: now },
      settings.scoreRules,
    );
    if (score < settings.scoreRules.threshold) continue;

    // Are abonament activ? → sărim peste
    const hasActiveSub = c.subscriptions.some((s) => s.usedEntries < s.totalEntries);
    if (hasActiveSub) continue;

    const exists = await db.task.findFirst({
      where: {
        contactId: c.id,
        type: "OFFER_SUBSCRIPTION",
        status: { in: ["NEW", "IN_PROGRESS"] },
      },
    });
    if (exists) continue;

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 3); // în 3 zile

    await db.task.create({
      data: {
        title: `Ofertă abonament — ${c.lastName} ${c.firstName} (scor ${score})`,
        type: "OFFER_SUBSCRIPTION",
        category: TASK_TYPE_DEFAULT_CATEGORY.OFFER_SUBSCRIPTION,
        contactId: c.id,
        dueDate,
        priority: "HIGH",
        status: "NEW",
        origin: "AUTO",
      },
    });
    result.offerSubscription++;
  }

  // ─── 3. Abonamente cu ≤ 1 intrare rămasă → „Propune reînnoirea" ──────────
  const subs = await db.subscription.findMany({ include: { contact: true } });
  const nearlyDone = subs.filter(
    (s) => s.totalEntries - s.usedEntries <= 1 && s.totalEntries - s.usedEntries >= 0,
  );

  for (const s of nearlyDone) {
    const exists = await db.task.findFirst({
      where: {
        contactId: s.contactId,
        type: "RENEW_SUBSCRIPTION",
        status: { in: ["NEW", "IN_PROGRESS"] },
      },
    });
    if (exists) continue;

    const remaining = s.totalEntries - s.usedEntries;
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 5);

    await db.task.create({
      data: {
        title:
          remaining === 0
            ? `Reînnoire abonament — ${s.contact.lastName} ${s.contact.firstName} (consumat)`
            : `Reînnoire abonament — ${s.contact.lastName} ${s.contact.firstName} (mai are 1 intrare)`,
        type: "RENEW_SUBSCRIPTION",
        category: TASK_TYPE_DEFAULT_CATEGORY.RENEW_SUBSCRIPTION,
        contactId: s.contactId,
        dueDate,
        priority: "MEDIUM",
        status: "NEW",
        origin: "AUTO",
      },
    });
    result.renewSubscription++;
  }

  // ─── 4. Contacte inactive 60+ zile → „Re-contactare campanie revival" ────
  const inactivityCutoff = new Date(now);
  inactivityCutoff.setDate(inactivityCutoff.getDate() - 60);

  for (const c of contacts) {
    const stage = computeStage(
      { leads: c.leads, subscriptions: c.subscriptions, referenceDate: now },
      computeScore(
        { leads: c.leads, subscriptions: c.subscriptions, referenceDate: now },
        settings.scoreRules,
      ),
      settings.scoreRules,
    );
    if (stage !== "INACTIVE") continue;

    const exists = await db.task.findFirst({
      where: {
        contactId: c.id,
        type: "LEAD_FOLLOWUP",
        status: { in: ["NEW", "IN_PROGRESS"] },
      },
    });
    if (exists) continue;

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 2);

    await db.task.create({
      data: {
        title: `Reactivare — ${c.lastName} ${c.firstName} (60+ zile inactiv)`,
        type: "LEAD_FOLLOWUP",
        category: TASK_TYPE_DEFAULT_CATEGORY.LEAD_FOLLOWUP,
        contactId: c.id,
        dueDate,
        priority: "LOW",
        status: "NEW",
        origin: "AUTO",
      },
    });
    result.inactivityRevival++;
  }

  return result;
}
