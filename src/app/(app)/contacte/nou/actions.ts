"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";

const childSchema = z.object({
  name: z.string().trim().min(1, "Numele copilului e obligatoriu").max(80),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data trebuie să fie validă (YYYY-MM-DD)")
    .refine((s) => !Number.isNaN(Date.parse(s)), "Data nu e validă"),
  interestIds: z.array(z.string()).default([]),
});

const schema = z.object({
  firstName: z.string().trim().min(1, "Prenumele e obligatoriu").max(80),
  lastName: z.string().trim().min(1, "Numele e obligatoriu").max(80),
  email: z.string().trim().toLowerCase().email("Email nevalid"),
  phone: z.string().trim().min(6, "Telefon prea scurt").max(30),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  initialSourceId: z.string().trim().min(1, "Alege sursa"),
  children: z.array(childSchema).default([]),
});

export type CreateContactState = {
  ok?: boolean;
  errors?: Record<string, string>;
  values?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    initialSourceId?: string;
    children?: Array<{
      name: string;
      birthDate: string;
      interestIds: string[];
    }>;
  };
};

export async function createContact(
  _prev: CreateContactState,
  formData: FormData,
): Promise<CreateContactState> {
  // Reasamblăm copiii din indexarea din formular
  const childrenCount = Number(formData.get("childrenCount") ?? 0);
  const children: Array<{ name: string; birthDate: string; interestIds: string[] }> = [];
  for (let i = 0; i < childrenCount; i++) {
    const name = String(formData.get(`children[${i}].name`) ?? "");
    const birthDate = String(formData.get(`children[${i}].birthDate`) ?? "");
    if (!name && !birthDate) continue; // rând complet gol → sărim peste
    const interestIds = formData.getAll(`children[${i}].interestIds`).map(String);
    children.push({ name, birthDate, interestIds });
  }

  const raw = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    initialSourceId: String(formData.get("initialSourceId") ?? ""),
    children,
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

  // Verificăm unicitatea email + telefon (Prisma ar arunca P2002, dar mesajul în română e mai prietenos)
  const existing = await db.contact.findFirst({
    where: {
      OR: [{ email: data.email }, { phone: data.phone }],
    },
    select: { email: true, phone: true },
  });
  if (existing) {
    const errors: Record<string, string> = {};
    if (existing.email === data.email)
      errors.email = "Există deja un contact cu acest email";
    if (existing.phone === data.phone)
      errors.phone = "Există deja un contact cu acest telefon";
    return { ok: false, errors, values: raw };
  }

  // Validăm că data nașterii nu e în viitor
  const today = new Date();
  for (let i = 0; i < data.children.length; i++) {
    const ch = data.children[i];
    if (new Date(ch.birthDate) > today) {
      return {
        ok: false,
        errors: { [`children.${i}.birthDate`]: "Data nașterii e în viitor" },
        values: raw,
      };
    }
  }

  await db.contact.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address || null,
      notes: data.notes || null,
      initialSourceId: data.initialSourceId,
      children: {
        create: data.children.map((ch) => ({
          name: ch.name,
          birthDate: new Date(ch.birthDate),
          interests: {
            create: ch.interestIds.map((id) => ({ interestId: id })),
          },
        })),
      },
    },
  });

  revalidatePath("/contacte");
  redirect("/contacte");
}
