"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { LEAD_TYPES } from "@/lib/domain";
import { estimateLeadValue } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

const childSchema = z.object({
  name: z.string().trim().min(1, "Numele copilului e obligatoriu").max(80),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data trebuie să fie validă (YYYY-MM-DD)"),
});

const baseLeadSchema = z.object({
  type: z.enum(LEAD_TYPES, "Tip rezervare nevalid"),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă"),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Oră invalidă"),
  sourceId: z.string().min(1, "Alege sursa"),
  adultsCount: z.coerce.number().int().min(0).max(20),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

const existingContactSchema = z.object({
  contactChoice: z.literal("existing"),
  contactId: z.string().min(1, "Selectează contactul"),
  childIds: z.array(z.string()).default([]),
});

const newContactSchema = z.object({
  contactChoice: z.literal("new"),
  firstName: z.string().trim().min(1, "Prenumele e obligatoriu").max(80),
  lastName: z.string().trim().min(1, "Numele e obligatoriu").max(80),
  email: z.string().trim().toLowerCase().email("Email nevalid"),
  phone: z.string().trim().min(6, "Telefon prea scurt").max(30),
  newChildren: z.array(childSchema).min(0).default([]),
});

const schema = z.intersection(
  baseLeadSchema,
  z.discriminatedUnion("contactChoice", [existingContactSchema, newContactSchema]),
);

export type CreateLeadState = {
  ok?: boolean;
  errors?: Record<string, string>;
  values?: Record<string, unknown>;
};

export async function createLead(
  _prev: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  // Citește copiii pentru contact nou
  const newChildrenCount = Number(formData.get("newChildrenCount") ?? 0);
  const newChildren: Array<{ name: string; birthDate: string }> = [];
  for (let i = 0; i < newChildrenCount; i++) {
    const name = String(formData.get(`newChildren[${i}].name`) ?? "");
    const birthDate = String(formData.get(`newChildren[${i}].birthDate`) ?? "");
    if (!name && !birthDate) continue;
    newChildren.push({ name, birthDate });
  }

  const raw = {
    type: String(formData.get("type") ?? ""),
    scheduledDate: String(formData.get("scheduledDate") ?? ""),
    scheduledTime: String(formData.get("scheduledTime") ?? ""),
    sourceId: String(formData.get("sourceId") ?? ""),
    adultsCount: formData.get("adultsCount") ?? "0",
    notes: String(formData.get("notes") ?? ""),
    contactChoice: String(formData.get("contactChoice") ?? "existing"),
    contactId: String(formData.get("contactId") ?? ""),
    childIds: formData.getAll("childIds").map(String),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    newChildren,
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

  const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}:00`);
  if (Number.isNaN(scheduledAt.getTime())) {
    return { ok: false, errors: { scheduledDate: "Dată/oră invalide" }, values: raw };
  }

  const settings = await getSettings();
  let createdLeadId: string;

  await db.$transaction(async (tx) => {
    let contactId: string;
    let childIdsForLead: string[];

    if (data.contactChoice === "existing") {
      contactId = data.contactId;
      childIdsForLead = data.childIds;
    } else {
      // Verificăm unicitate email/telefon
      const existing = await tx.contact.findFirst({
        where: { OR: [{ email: data.email }, { phone: data.phone }] },
      });
      if (existing) {
        throw new Error(
          existing.email === data.email
            ? "Există deja un contact cu acest email"
            : "Există deja un contact cu acest telefon",
        );
      }
      const contact = await tx.contact.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          initialSourceId: data.sourceId,
          children: {
            create: data.newChildren.map((c) => ({
              name: c.name,
              birthDate: new Date(c.birthDate),
            })),
          },
        },
        include: { children: true },
      });
      contactId = contact.id;
      childIdsForLead = contact.children.map((c) => c.id);
    }

    // Calculăm valoarea estimată
    const estimatedValue = estimateLeadValue({
      type: data.type,
      childrenCount: childIdsForLead.length,
      adultsCount: data.adultsCount,
      prices: settings.prices,
    });

    const lead = await tx.lead.create({
      data: {
        contactId,
        type: data.type,
        sourceId: data.sourceId,
        scheduledAt,
        adultsCount: data.adultsCount,
        status: "NEW",
        estimatedValue,
        notes: data.notes || null,
        children: {
          create: childIdsForLead.map((id) => ({ childId: id })),
        },
      },
    });

    createdLeadId = lead.id;
  });

  revalidatePath("/rezervari");
  revalidatePath("/contacte");
  redirect("/rezervari");
}
