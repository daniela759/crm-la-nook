"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth-server";

export type UserActionState = {
  ok?: boolean;
  errors?: Record<string, string>;
  generatedPassword?: string;
  message?: string;
};

const addSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalid"),
  name: z.string().trim().max(100).optional().or(z.literal("")),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "Nook-";
  for (let i = 0; i < 8; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd + "!";
}

export async function addUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  await requireAdmin();
  const parsed = addSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const p = issue.path.join(".");
      if (!errors[p]) errors[p] = issue.message;
    }
    return { ok: false, errors };
  }
  const { email, name, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, errors: { email: "Există deja un utilizator cu acest email" } };
  }

  const password = generatePassword();
  const hash = await hashPassword(password);
  await db.user.create({
    data: {
      email,
      name: name || null,
      role,
      passwordHash: hash,
      active: true,
    },
  });
  revalidatePath("/utilizatori");
  return {
    ok: true,
    generatedPassword: password,
    message: `Cont creat pentru ${email}. Distribuie parola: ${password}`,
  };
}

const idSchema = z.object({ id: z.string().min(1) });

export async function toggleActiveAction(formData: FormData) {
  const current = await requireAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  if (id === current.id) {
    throw new Error("Nu te poți dezactiva singur — cere altui admin.");
  }
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return;
  await db.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/utilizatori");
}

export async function changeRoleAction(formData: FormData) {
  const current = await requireAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const newRole = String(formData.get("role") ?? "USER");
  if (newRole !== "USER" && newRole !== "ADMIN") return;
  if (id === current.id && newRole === "USER") {
    throw new Error(
      "Nu îți poți retrage propriul rol de admin — cere altui admin.",
    );
  }
  await db.user.update({ where: { id }, data: { role: newRole } });
  revalidatePath("/utilizatori");
}

export async function resetPasswordAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  await requireAdmin();
  const { id } = idSchema.parse({ id: formData.get("id") });
  const u = await db.user.findUnique({ where: { id } });
  if (!u) return { ok: false, errors: { general: "Utilizator inexistent" } };

  const password = generatePassword();
  const hash = await hashPassword(password);
  await db.user.update({ where: { id }, data: { passwordHash: hash } });
  revalidatePath("/utilizatori");
  return {
    ok: true,
    generatedPassword: password,
    message: `Parolă nouă pentru ${u.email}: ${password}`,
  };
}
