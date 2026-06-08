"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  DEFAULT_PRICES,
  DEFAULT_SCHEDULE,
  DEFAULT_SCORE_RULES,
  DEFAULT_TARGETS,
} from "@/lib/domain";
import { requireSuperAdmin } from "@/lib/permissions";

const pricesSchema = z.object({
  childVisit: z.coerce.number().int().min(0).max(10000),
  parentVisit: z.coerce.number().int().min(0).max(10000),
  birthday: z.coerce.number().int().min(0).max(100000),
  eventFee: z.coerce.number().int().min(0).max(10000),
  subscription8: z.coerce.number().int().min(0).max(10000),
  subscription4: z.coerce.number().int().min(0).max(10000),
});

const targetsSchema = z.object({
  survival: z.coerce.number().int().min(0).max(1000000),
  breakEven: z.coerce.number().int().min(0).max(1000000),
  profitability: z.coerce.number().int().min(0).max(1000000),
});

const scheduleSchema = z.object({
  weekdayMorningStart: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  weekdayMorningEnd: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  weekdayAfternoonStart: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  weekdayAfternoonEnd: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  weekendStart: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  weekendEnd: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:mm"),
  birthdayDurationHours: z.coerce.number().int().min(1).max(12),
  slotCapacity: z.coerce.number().int().min(1).max(200),
});

const scoreRulesSchema = z.object({
  booking: z.coerce.number().int().min(-100).max(100),
  confirmed: z.coerce.number().int().min(-100).max(100),
  visit: z.coerce.number().int().min(-100).max(100),
  secondVisitWithin30d: z.coerce.number().int().min(-100).max(100),
  eventAttendance: z.coerce.number().int().min(-100).max(100),
  birthdayHeld: z.coerce.number().int().min(-100).max(100),
  subscriptionInterest: z.coerce.number().int().min(-100).max(100),
  noShow: z.coerce.number().int().min(-100).max(100),
  inactivity60d: z.coerce.number().int().min(-100).max(100),
  threshold: z.coerce.number().int().min(0).max(500),
});

export type ActionState = { ok?: boolean; error?: string };

async function getSettingsRow() {
  return db.settings.findUnique({ where: { id: 1 } });
}

function asJSON(obj: unknown) {
  return JSON.stringify(obj);
}

export async function updatePrices(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = pricesSchema.safeParse({
    childVisit: formData.get("childVisit"),
    parentVisit: formData.get("parentVisit"),
    birthday: formData.get("birthday"),
    eventFee: formData.get("eventFee"),
    subscription8: formData.get("subscription8"),
    subscription4: formData.get("subscription4"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  await db.settings.upsert({
    where: { id: 1 },
    update: { prices: asJSON(parsed.data) },
    create: {
      id: 1,
      prices: asJSON(parsed.data),
      schedule: asJSON(DEFAULT_SCHEDULE),
      targets: asJSON(DEFAULT_TARGETS),
      scoreRules: asJSON(DEFAULT_SCORE_RULES),
    },
  });
  revalidatePath("/setari");
  revalidatePath("/financiar");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateTargets(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = targetsSchema.safeParse({
    survival: formData.get("survival"),
    breakEven: formData.get("breakEven"),
    profitability: formData.get("profitability"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  if (
    parsed.data.survival >= parsed.data.breakEven ||
    parsed.data.breakEven >= parsed.data.profitability
  ) {
    return {
      error: "Pragurile trebuie să crească: minim < break-even < profitabilitate",
    };
  }
  const existing = await getSettingsRow();
  await db.settings.upsert({
    where: { id: 1 },
    update: { targets: asJSON(parsed.data) },
    create: {
      id: 1,
      prices: existing?.prices ?? asJSON(DEFAULT_PRICES),
      schedule: existing?.schedule ?? asJSON(DEFAULT_SCHEDULE),
      targets: asJSON(parsed.data),
      scoreRules: existing?.scoreRules ?? asJSON(DEFAULT_SCORE_RULES),
    },
  });
  revalidatePath("/setari");
  revalidatePath("/financiar");
  revalidatePath("/dashboard");
  revalidatePath("/incasari");
  return { ok: true };
}

export async function updateSchedule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = scheduleSchema.safeParse({
    weekdayMorningStart: formData.get("weekdayMorningStart"),
    weekdayMorningEnd: formData.get("weekdayMorningEnd"),
    weekdayAfternoonStart: formData.get("weekdayAfternoonStart"),
    weekdayAfternoonEnd: formData.get("weekdayAfternoonEnd"),
    weekendStart: formData.get("weekendStart"),
    weekendEnd: formData.get("weekendEnd"),
    birthdayDurationHours: formData.get("birthdayDurationHours"),
    slotCapacity: formData.get("slotCapacity"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const schedule = {
    weekday: [
      { start: parsed.data.weekdayMorningStart, end: parsed.data.weekdayMorningEnd },
      { start: parsed.data.weekdayAfternoonStart, end: parsed.data.weekdayAfternoonEnd },
    ],
    weekend: [{ start: parsed.data.weekendStart, end: parsed.data.weekendEnd }],
    birthdayDurationHours: parsed.data.birthdayDurationHours,
    slotCapacity: parsed.data.slotCapacity,
  };
  const existing = await getSettingsRow();
  await db.settings.upsert({
    where: { id: 1 },
    update: { schedule: asJSON(schedule) },
    create: {
      id: 1,
      prices: existing?.prices ?? asJSON(DEFAULT_PRICES),
      schedule: asJSON(schedule),
      targets: existing?.targets ?? asJSON(DEFAULT_TARGETS),
      scoreRules: existing?.scoreRules ?? asJSON(DEFAULT_SCORE_RULES),
    },
  });
  revalidatePath("/setari");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function updateScoreRules(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = scoreRulesSchema.safeParse({
    booking: formData.get("booking"),
    confirmed: formData.get("confirmed"),
    visit: formData.get("visit"),
    secondVisitWithin30d: formData.get("secondVisitWithin30d"),
    eventAttendance: formData.get("eventAttendance"),
    birthdayHeld: formData.get("birthdayHeld"),
    subscriptionInterest: formData.get("subscriptionInterest"),
    noShow: formData.get("noShow"),
    inactivity60d: formData.get("inactivity60d"),
    threshold: formData.get("threshold"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const existing = await getSettingsRow();
  await db.settings.upsert({
    where: { id: 1 },
    update: { scoreRules: asJSON(parsed.data) },
    create: {
      id: 1,
      prices: existing?.prices ?? asJSON(DEFAULT_PRICES),
      schedule: existing?.schedule ?? asJSON(DEFAULT_SCHEDULE),
      targets: existing?.targets ?? asJSON(DEFAULT_TARGETS),
      scoreRules: asJSON(parsed.data),
    },
  });
  revalidatePath("/setari");
  revalidatePath("/contacte");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─── Liste (surse de lead + interese) ────────────────────────────────────
const listSchema = z.object({
  name: z.string().trim().min(1, "Numele e obligatoriu").max(60),
});

export async function addLeadSource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = listSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const exists = await db.leadSource.findUnique({ where: { name: parsed.data.name } });
  if (exists) return { error: "Există deja o sursă cu acest nume" };
  await db.leadSource.create({ data: { name: parsed.data.name } });
  revalidatePath("/setari");
  return { ok: true };
}

export async function toggleLeadSource(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const s = await db.leadSource.findUnique({ where: { id } });
  if (!s) return;
  await db.leadSource.update({ where: { id }, data: { active: !s.active } });
  revalidatePath("/setari");
}

export async function addInterest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = listSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const exists = await db.interest.findUnique({ where: { name: parsed.data.name } });
  if (exists) return { error: "Există deja un interes cu acest nume" };
  await db.interest.create({ data: { name: parsed.data.name } });
  revalidatePath("/setari");
  return { ok: true };
}

export async function toggleInterest(formData: FormData) {
  await requireSuperAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const it = await db.interest.findUnique({ where: { id } });
  if (!it) return;
  await db.interest.update({ where: { id }, data: { active: !it.active } });
  revalidatePath("/setari");
}
