"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { TASK_TYPE_DEFAULT_CATEGORY } from "@/lib/domain";
import { requireEditor } from "@/lib/permissions";
import { getSettings } from "@/lib/settings";

const idSchema = z.object({ leadId: z.string().min(1) });

/**
 * Confirmă o rezervare: NEW/CONTACTED → CONFIRMED.
 */
export async function confirmLead(formData: FormData) {
  await requireEditor();
  const { leadId } = idSchema.parse({ leadId: formData.get("leadId") });
  await db.lead.update({
    where: { id: leadId },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/rezervari");
}

/**
 * Marchează rezervarea ca PREZENTĂ — generează tranzacții COLLECTED.
 * Dacă contactul are abonament activ și e o VIZITĂ, consumă intrările
 * (cât numărul de copii din rezervare) și NU mai facturăm vizita copiilor.
 */
export async function markPresent(formData: FormData) {
  await requireEditor();
  const { leadId } = idSchema.parse({ leadId: formData.get("leadId") });

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { children: true, contact: true },
  });
  if (!lead) throw new Error("Lead inexistent");

  const settings = await getSettings();
  const childrenCount = lead.children.length;

  await db.$transaction(async (tx) => {
    // 1. Schimbă status-ul lead-ului
    await tx.lead.update({
      where: { id: leadId },
      data: { status: "PRESENT" },
    });

    // 2. Tratează tipul rezervării
    if (lead.type === "VISIT") {
      // Caută abonament activ (SQLite nu poate compara două coloane în where → findMany + find)
      const subs = await tx.subscription.findMany({
        where: { contactId: lead.contactId },
        orderBy: { purchasedAt: "asc" }, // consumăm întâi cel mai vechi
      });
      const usable = subs.find((s) => s.usedEntries < s.totalEntries);

      let childrenToCharge = childrenCount;

      if (usable && childrenCount > 0) {
        const entriesLeft = usable.totalEntries - usable.usedEntries;
        const consumed = Math.min(entriesLeft, childrenCount);
        await tx.subscription.update({
          where: { id: usable.id },
          data: { usedEntries: usable.usedEntries + consumed },
        });
        childrenToCharge = childrenCount - consumed;
      }

      if (childrenToCharge > 0) {
        await tx.transaction.create({
          data: {
            contactId: lead.contactId,
            leadId: lead.id,
            revenueType: "CHILD_VISIT",
            amount: childrenToCharge * settings.prices.childVisit,
            status: "COLLECTED",
            date: new Date(),
            paymentMethod: "CARD",
          },
        });
      }
      if (lead.adultsCount > 0) {
        await tx.transaction.create({
          data: {
            contactId: lead.contactId,
            leadId: lead.id,
            revenueType: "PARENT_VISIT",
            amount: lead.adultsCount * settings.prices.parentVisit,
            status: "COLLECTED",
            date: new Date(),
            paymentMethod: "CARD",
          },
        });
      }
    } else if (lead.type === "BIRTHDAY") {
      await tx.transaction.create({
        data: {
          contactId: lead.contactId,
          leadId: lead.id,
          revenueType: "BIRTHDAY",
          amount: settings.prices.birthday,
          status: "COLLECTED",
          date: new Date(),
          paymentMethod: "TRANSFER",
        },
      });
    } else if (lead.type === "EVENT") {
      await tx.transaction.create({
        data: {
          contactId: lead.contactId,
          leadId: lead.id,
          revenueType: "EVENT",
          amount: settings.prices.eventFee,
          status: "COLLECTED",
          date: new Date(),
          paymentMethod: "CARD",
        },
      });
    }
  });

  revalidatePath("/rezervari");
  revalidatePath("/contacte");
}

/**
 * Marchează NO-SHOW. Creează automat un task de re-contactare la +48h.
 */
export async function markAbsent(formData: FormData) {
  await requireEditor();
  const { leadId } = idSchema.parse({ leadId: formData.get("leadId") });

  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { contact: true },
  });
  if (!lead) throw new Error("Lead inexistent");

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2); // +48h

  await db.$transaction([
    db.lead.update({
      where: { id: leadId },
      data: { status: "ABSENT" },
    }),
    db.task.create({
      data: {
        title: `Recuperare no-show — ${lead.contact.firstName} ${lead.contact.lastName}`,
        type: "RECOVER_NO_SHOW",
        category: TASK_TYPE_DEFAULT_CATEGORY.RECOVER_NO_SHOW,
        contactId: lead.contactId,
        leadId: lead.id,
        dueDate,
        priority: "MEDIUM",
        status: "NEW",
        origin: "AUTO",
      },
    }),
  ]);

  revalidatePath("/rezervari");
  revalidatePath("/taskuri");
}

/**
 * Anulează rezervarea. Tranzacțiile asociate (dacă există) se păstrează.
 */
export async function cancelLead(formData: FormData) {
  await requireEditor();
  const { leadId } = idSchema.parse({ leadId: formData.get("leadId") });
  await db.lead.update({
    where: { id: leadId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/rezervari");
}
