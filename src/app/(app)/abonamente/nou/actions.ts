"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  PAYMENT_METHODS,
  SUBSCRIPTION_ENTRIES,
  SUBSCRIPTION_TYPES,
} from "@/lib/domain";
import { getSettings } from "@/lib/settings";

const schema = z.object({
  contactId: z.string().min(1, "Selectează contactul"),
  type: z.enum(SUBSCRIPTION_TYPES, "Alege tipul de abonament"),
  paymentMethod: z.enum(PAYMENT_METHODS).default("CARD"),
  pricePaidOverride: z.coerce.number().min(0).optional(),
});

export type SellSubscriptionState = {
  ok?: boolean;
  errors?: Record<string, string>;
  values?: Record<string, unknown>;
};

export async function sellSubscription(
  _prev: SellSubscriptionState,
  formData: FormData,
): Promise<SellSubscriptionState> {
  const raw = {
    contactId: String(formData.get("contactId") ?? ""),
    type: String(formData.get("type") ?? ""),
    paymentMethod: String(formData.get("paymentMethod") ?? "CARD"),
    pricePaidOverride: formData.get("pricePaidOverride") || undefined,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!errors[path]) errors[path] = issue.message;
    }
    return { ok: false, errors, values: raw };
  }
  const data = parsed.data;

  const settings = await getSettings();
  const defaultPrice =
    data.type === "ENTRIES_8"
      ? settings.prices.subscription8
      : settings.prices.subscription4;
  const price = data.pricePaidOverride ?? defaultPrice;
  const entries = SUBSCRIPTION_ENTRIES[data.type];

  await db.$transaction([
    db.subscription.create({
      data: {
        contactId: data.contactId,
        type: data.type,
        totalEntries: entries,
        usedEntries: 0,
        pricePaid: price,
        purchasedAt: new Date(),
      },
    }),
    db.transaction.create({
      data: {
        contactId: data.contactId,
        revenueType: "SUBSCRIPTION",
        amount: price,
        status: "COLLECTED",
        date: new Date(),
        paymentMethod: data.paymentMethod,
      },
    }),
  ]);

  revalidatePath("/abonamente");
  revalidatePath("/financiar");
  revalidatePath("/incasari");
  revalidatePath("/contacte");
  redirect("/abonamente");
}
