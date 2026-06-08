"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireEditor, requireSuperAdmin } from "@/lib/permissions";

const updateSchema = z.object({
  id: z.string().min(1),
  firstName: z.string().trim().min(1, "Prenumele e obligatoriu").max(80),
  lastName: z.string().trim().min(1, "Numele e obligatoriu").max(80),
  email: z.string().trim().toLowerCase().email("Email nevalid"),
  phone: z.string().trim().min(6, "Telefon prea scurt").max(30),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  initialSourceId: z.string().min(1, "Alege sursa"),
});

export type ContactActionState = {
  ok?: boolean;
  errors?: Record<string, string>;
};

export async function updateContact(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  await requireEditor();
  const raw = {
    id: String(formData.get("id") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    initialSourceId: String(formData.get("initialSourceId") ?? ""),
  };
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const p = issue.path.join(".");
      if (!errors[p]) errors[p] = issue.message;
    }
    return { ok: false, errors };
  }
  const data = parsed.data;

  // Verifică unicitate email/telefon (altul decât el)
  const existing = await db.contact.findFirst({
    where: {
      id: { not: data.id },
      OR: [{ email: data.email }, { phone: data.phone }],
    },
    select: { email: true, phone: true },
  });
  if (existing) {
    const errors: Record<string, string> = {};
    if (existing.email === data.email) errors.email = "Email folosit de alt contact";
    if (existing.phone === data.phone) errors.phone = "Telefon folosit de alt contact";
    return { ok: false, errors };
  }

  await db.contact.update({
    where: { id: data.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address || null,
      notes: data.notes || null,
      initialSourceId: data.initialSourceId,
    },
  });

  revalidatePath(`/contacte/${data.id}`);
  revalidatePath("/contacte");
  return { ok: true };
}

export async function deleteContact(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Verificăm că nu are date dependente (siguranță)
  const counts = await db.contact.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          leads: true,
          subscriptions: true,
          transactions: true,
        },
      },
    },
  });
  if (!counts) return;
  const hasData =
    counts._count.leads > 0 ||
    counts._count.subscriptions > 0 ||
    counts._count.transactions > 0;
  if (hasData) {
    throw new Error(
      "Acest contact are rezervări, abonamente sau tranzacții. Șterge-le mai întâi sau marchează contactul ca inactiv.",
    );
  }

  await db.contact.delete({ where: { id } });
  revalidatePath("/contacte");
  redirect("/contacte");
}

// ─── Copii ────────────────────────────────────────────────────────────────
const childSchema = z.object({
  contactId: z.string().min(1),
  name: z.string().trim().min(1, "Numele e obligatoriu").max(80),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă"),
  interestIds: z.array(z.string()).default([]),
});

export async function addChild(
  _prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  await requireEditor();
  const raw = {
    contactId: String(formData.get("contactId") ?? ""),
    name: String(formData.get("name") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    interestIds: formData.getAll("interestIds").map(String),
  };
  const parsed = childSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const p = issue.path.join(".");
      if (!errors[p]) errors[p] = issue.message;
    }
    return { ok: false, errors };
  }
  const data = parsed.data;
  if (new Date(data.birthDate) > new Date()) {
    return { ok: false, errors: { birthDate: "Data nașterii e în viitor" } };
  }
  await db.child.create({
    data: {
      contactId: data.contactId,
      name: data.name,
      birthDate: new Date(data.birthDate),
      interests: { create: data.interestIds.map((id) => ({ interestId: id })) },
    },
  });
  revalidatePath(`/contacte/${data.contactId}`);
  return { ok: true };
}

export async function deleteChild(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  const contactId = String(formData.get("contactId") ?? "");
  if (!id) return;

  // Verificăm că nu participă la rezervări
  const used = await db.leadChild.findFirst({ where: { childId: id } });
  if (used) {
    throw new Error(
      "Acest copil are rezervări în istoric. Nu poate fi șters (data se păstrează pentru raportare).",
    );
  }

  await db.child.delete({ where: { id } });
  if (contactId) revalidatePath(`/contacte/${contactId}`);
  revalidatePath("/contacte");
}
