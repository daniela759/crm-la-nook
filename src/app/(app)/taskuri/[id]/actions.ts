"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { PRIORITIES, TASK_CATEGORIES, TASK_STATUSES } from "@/lib/domain";
import { requireTaskEditor } from "@/lib/permissions";

const MAX_FILE = 10 * 1024 * 1024; // 10MB

export type EditState = { ok?: boolean; error?: string };

const editSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().trim().min(1, "Titlul e obligatoriu").max(200),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  category: z.enum(TASK_CATEGORIES),
  priority: z.enum(PRIORITIES),
  status: z.enum(TASK_STATUSES),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dată invalidă").optional().or(z.literal("")),
});

export async function updateTask(_prev: EditState, formData: FormData): Promise<EditState> {
  await requireTaskEditor();
  const parsed = editSchema.safeParse({
    taskId: formData.get("taskId"),
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    dueDate: formData.get("dueDate") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Date invalide" };
  }
  const d = parsed.data;
  await db.task.update({
    where: { id: d.taskId },
    data: {
      title: d.title,
      description: d.description || null,
      category: d.category,
      priority: d.priority,
      status: d.status,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
    },
  });
  revalidatePath(`/taskuri/${d.taskId}`);
  revalidatePath("/taskuri");
  return { ok: true };
}

export async function deleteTask(formData: FormData) {
  await requireTaskEditor();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;
  await db.task.delete({ where: { id: taskId } });
  revalidatePath("/taskuri");
  redirect("/taskuri");
}

export async function addComment(formData: FormData) {
  const user = await requireTaskEditor();
  const taskId = String(formData.get("taskId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!taskId || !body) return;
  await db.taskComment.create({
    data: { taskId, body: body.slice(0, 4000), authorId: user.id, authorName: user.name || user.email },
  });
  revalidatePath(`/taskuri/${taskId}`);
}

export async function deleteComment(formData: FormData) {
  await requireTaskEditor();
  const id = String(formData.get("id") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  if (!id) return;
  await db.taskComment.delete({ where: { id } });
  revalidatePath(`/taskuri/${taskId}`);
}

export async function addAttachmentLink(formData: FormData) {
  const user = await requireTaskEditor();
  const taskId = String(formData.get("taskId") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  if (!taskId || !/^https?:\/\//i.test(url)) return;
  await db.taskAttachment.create({
    data: { taskId, filename: label || url, url, uploadedBy: user.name || user.email },
  });
  revalidatePath(`/taskuri/${taskId}`);
}

export type UploadState = { ok?: boolean; error?: string };

export async function uploadAttachment(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const user = await requireTaskEditor();
  const taskId = String(formData.get("taskId") ?? "");
  const file = formData.get("file") as File | null;
  if (!taskId || !file || file.size === 0) return { ok: false, error: "Alege un fișier." };
  if (file.size > MAX_FILE) {
    return { ok: false, error: "Fișier prea mare (max 10MB). Pentru fișiere mari folosește un link." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  await db.taskAttachment.create({
    data: {
      taskId,
      filename: file.name,
      mimeType: file.type || null,
      size: file.size,
      data: buf,
      uploadedBy: user.name || user.email,
    },
  });
  revalidatePath(`/taskuri/${taskId}`);
  return { ok: true };
}

export async function deleteAttachment(formData: FormData) {
  await requireTaskEditor();
  const id = String(formData.get("id") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  if (!id) return;
  await db.taskAttachment.delete({ where: { id } });
  revalidatePath(`/taskuri/${taskId}`);
}
