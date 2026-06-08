"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { PRIORITIES, TASK_CATEGORIES, TASK_TYPES } from "@/lib/domain";
import { requireEditor, requireSuperAdmin } from "@/lib/permissions";
import { runAutomations } from "@/lib/automation";

const idSchema = z.object({ taskId: z.string().min(1) });

export async function completeTask(formData: FormData) {
  await requireEditor();
  const { taskId } = idSchema.parse({ taskId: formData.get("taskId") });
  await db.task.update({
    where: { id: taskId },
    data: { status: "DONE" },
  });
  revalidatePath("/taskuri");
  revalidatePath("/dashboard");
}

export async function reopenTask(formData: FormData) {
  await requireEditor();
  const { taskId } = idSchema.parse({ taskId: formData.get("taskId") });
  await db.task.update({
    where: { id: taskId },
    data: { status: "TODO" },
  });
  revalidatePath("/taskuri");
}

export async function snoozeTask(formData: FormData) {
  await requireEditor();
  const { taskId } = idSchema.parse({ taskId: formData.get("taskId") });
  const task = await db.task.findUnique({ where: { id: taskId } });
  if (!task) return;
  const newDue = new Date(task.dueDate);
  newDue.setDate(newDue.getDate() + 1);
  await db.task.update({
    where: { id: taskId },
    data: { dueDate: newDue },
  });
  revalidatePath("/taskuri");
}

const addSchema = z.object({
  title: z.string().trim().min(1, "Titlul e obligatoriu").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  type: z.enum(TASK_TYPES).default("OTHER"),
  category: z.enum(TASK_CATEGORIES).default("OPERATIONAL"),
  priority: z.enum(PRIORITIES).default("MEDIUM"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă"),
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
  const editor = await requireEditor();
  const raw = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    type: String(formData.get("type") ?? "OTHER"),
    category: String(formData.get("category") ?? "OPERATIONAL"),
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
  const category = editor.role === "OPERATIONAL" ? "OPERATIONAL" : data.category;

  await db.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      type: data.type,
      category,
      priority: data.priority,
      dueDate: new Date(data.dueDate),
      contactId: data.contactId || null,
      status: "TODO",
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
