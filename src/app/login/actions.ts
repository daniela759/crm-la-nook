"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  SESSION_CONFIG,
  checkCredentials,
  createSessionToken,
} from "@/lib/auth";

const schema = z.object({
  username: z.string().trim().min(1, "Utilizator necesar"),
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
    username: formData.get("username"),
    password: formData.get("password"),
    from: formData.get("from"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const { username, password, from } = parsed.data;

  if (!checkCredentials(username, password)) {
    return { error: "Utilizator sau parolă greșite" };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_CONFIG.name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_CONFIG.maxAge,
  });

  // Verificăm că destinația e relativă (anti open-redirect)
  const target = from && from.startsWith("/") && !from.startsWith("//")
    ? from
    : "/dashboard";

  redirect(target);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_CONFIG.name);
  redirect("/login");
}
