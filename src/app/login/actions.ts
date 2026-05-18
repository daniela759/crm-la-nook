"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  SESSION_CONFIG,
  createSessionToken,
  verifyPassword,
} from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalid"),
  password: z.string().min(1, "Parolă necesară"),
  from: z.string().optional(),
});

export type LoginState = {
  ok?: boolean;
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    from: formData.get("from"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { email, password, from } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return { error: "Email sau parolă greșite" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Email sau parolă greșite" };
  }

  // Update lastLoginAt
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await createSessionToken(user.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_CONFIG.name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_CONFIG.maxAge,
  });

  // Verificăm că destinația e relativă (anti open-redirect)
  const target =
    from && from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";

  redirect(target);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_CONFIG.name);
  redirect("/login");
}
