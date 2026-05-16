"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { PRIORITIES, TASK_TYPES } from "@/lib/domain";
import { runAutomations } from "@/lib/automation";

const idSchema = z.object({ taskId: z.string().min(1) });

export async function completeTask(formData: FormData) {
  const { taskId } = idSchema.parse({ taskId: formData.get("taskId") });
  await db.task.update({
    where: { id: taskId },
    data: { status: "DONE" },
  });
  revalidatePath("/taskuri");
  revalidatePath("/dashboard");
}

export async function reopenTask(formData: FormData) {
  const { taskId } = idSchema.parse({ taskId: formData.get("taskId") });
  await db.task.update({
    where: { id: taskId },
    data: { status: "TODO" },
  });
  revalidatePath("/taskuri");
}

export async function snoozeTask(formData: FormData) {
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
  type: z.enum(TASK_TYPES).default("OTHER"),
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
  const raw = {
    title: String(formData.get("title") ?? ""),
    type: String(formData.get("type") ?? "OTHER"),
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

  await db.task.create({
    data: {
      title: data.title,
      type: data.type,
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

export async function runAutomationsAction() {
  const result = await runAutomations(new Date());
  revalidatePath("/taskuri");
  revalidatePath("/dashboard");
  return result;
}
