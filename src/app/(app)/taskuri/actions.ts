"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { PRIORITIES, TASK_CATEGORIES, TASK_STATUSES, TASK_TYPES } from "@/lib/domain";
import { requireSuperAdmin, requireTaskManager } from "@/lib/permissions";
import { runAutomations } from "@/lib/automation";

/** Schimbă statusul unui task (Nou / În progres / Amânat / Finalizat). */
export async function setTaskStatus(formData: FormData) {
  await requireTaskManager();
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!taskId || !(TASK_STATUSES as readonly string[]).includes(status)) return;
  await db.task.update({ where: { id: taskId }, data: { status } });
  revalidatePath("/taskuri");
  revalidatePath("/dashboard");
}

/** Setează (sau șterge) deadline-ul unui task. Gol = fără termen. */
export async function setTaskDueDate(formData: FormData) {
  await requireTaskManager();
  const taskId = String(formData.get("taskId") ?? "");
  const due = String(formData.get("dueDate") ?? "");
  if (!taskId) return;
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(due) ? new Date(due) : null;
  await db.task.update({ where: { id: taskId }, data: { dueDate } });
  revalidatePath("/taskuri");
  revalidatePath("/dashboard");
}

const addSchema = z.object({
  title: z.string().trim().min(1, "Titlul e obligatoriu").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  type: z.enum(TASK_TYPES).default("OTHER"),
  category: z.enum(TASK_CATEGORIES).default("OPERATIONAL"),
  status: z.enum(TASK_STATUSES).default("NEW"),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă").optional().or(z.literal("")),
  contactId: z.string().optional(),
});

export type AddTaskState = {
  ok?: boolean;
  errors?: Record<string, string>;
};

export async function addManualTask(
  _prev: AddTaskState,
  formData: FormData,
): Promise<AddTaskState> {
  const mgr = await requireTaskManager();
  const raw = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    type: String(formData.get("type") ?? "OTHER"),
    category: String(formData.get("category") ?? "OPERATIONAL"),
    status: String(formData.get("status") ?? "NEW"),
    priority: String(formData.get("priority") ?? "MEDIUM"),
    dueDate: String(formData.get("dueDate") ?? ""),
    contactId: (formData.get("contactId") as string) || undefined,
  };

  const parsed = addSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const p = issue.path.join(".");
      if (!errors[p]) errors[p] = issue.message;
    }
    return { ok: false, errors };
  }
  const data = parsed.data;

  // Personalul operațional creează doar taskuri operaționale (altfel nu le-ar vedea).
  const category = mgr.role === "OPERATIONAL" ? "OPERATIONAL" : data.category;

  await db.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      type: data.type,
      category,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      contactId: data.contactId || null,
      origin: "MANUAL",
    },
  });

  revalidatePath("/taskuri");
  return { ok: true };
}

export async function runAutomationsAction(): Promise<void> {
  await requireSuperAdmin();
  await runAutomations(new Date());
  revalidatePath("/taskuri");
  revalidatePath("/dashboard");
}
