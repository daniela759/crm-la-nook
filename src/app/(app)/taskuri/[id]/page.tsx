import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import { IconBack } from "@/components/icons";
import {
  PRIORITY_LABEL,
  TASK_CATEGORY_LABEL,
  TASK_STATUS_LABEL,
  type Priority,
  type TaskCategory,
  type TaskStatus,
} from "@/lib/domain";
import { formatDate, formatDateTime } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth-server";
import { canEditTasks, visibleTaskCategories } from "@/lib/permissions";
import { EditTaskForm } from "./EditTaskForm";
import { AttachmentUpload } from "./AttachmentUpload";
import {
  addAttachmentLink,
  addComment,
  deleteAttachment,
  deleteComment,
  deleteTask,
} from "./actions";

function fmtSize(n: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const role = user?.role;
  const canEdit = canEditTasks(role);

  const task = await db.task.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true } },
      comments: { orderBy: { createdAt: "asc" } },
      attachments: {
        select: { id: true, filename: true, mimeType: true, size: true, url: true, uploadedBy: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!task) notFound();

  // Operaționalul vede doar taskuri operaționale.
  const allowed = visibleTaskCategories(role) as string[];
  if (!allowed.includes(task.category)) redirect("/taskuri");

  const status = task.status as TaskStatus;
  const category = task.category as TaskCategory;
  const priority = task.priority as Priority;

  return (
    <PageContainer>
      <Link
        href="/taskuri"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-nook-ink-soft hover:text-nook-ink"
      >
        <IconBack />
        Înapoi la taskuri
      </Link>

      <PageHeader
        title={task.title}
        description={`${TASK_CATEGORY_LABEL[category] ?? task.category} · ${TASK_STATUS_LABEL[status] ?? task.status} · prioritate ${PRIORITY_LABEL[priority] ?? task.priority}`}
      />

      {/* Sumar */}
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Info label="Tipologie" value={TASK_CATEGORY_LABEL[category] ?? task.category} />
        <Info label="Status" value={TASK_STATUS_LABEL[status] ?? task.status} />
        <Info label="Prioritate" value={PRIORITY_LABEL[priority] ?? task.priority} />
        <Info label="Deadline" value={task.dueDate ? formatDate(task.dueDate) : "Fără termen"} />
      </div>

      {task.description && (
        <div className="mt-6 rounded-2xl bg-nook-paper p-6 ring-1 ring-nook-line">
          <h2 className="mb-2 font-display text-sm font-bold uppercase tracking-widest text-nook-ink-soft">
            Descriere
          </h2>
          <p className="whitespace-pre-wrap text-sm text-nook-ink">{task.description}</p>
        </div>
      )}

      {/* Editare (super-admin + marketing) */}
      {canEdit && (
        <div className="mt-6">
          <EditTaskForm
            task={{
              id: task.id,
              title: task.title,
              description: task.description,
              category: task.category,
              priority: task.priority,
              status: task.status,
              dueDateISO: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "",
            }}
          />
        </div>
      )}

      {/* Fișiere */}
      <div className="mt-8 rounded-2xl bg-nook-paper p-6 ring-1 ring-nook-line">
        <h2 className="mb-3 font-display text-base font-bold text-nook-forest">
          Fișiere ({task.attachments.length})
        </h2>
        {task.attachments.length === 0 ? (
          <p className="text-sm italic text-nook-ink-soft">Niciun fișier atașat.</p>
        ) : (
          <ul className="space-y-2">
            {task.attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-nook-paper-warm/40 px-3 py-2"
              >
                <a
                  href={a.url ?? `/api/task-files/${a.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm font-medium text-nook-forest hover:underline"
                >
                  {a.url ? "🔗 " : "📎 "}
                  {a.filename}
                  {a.size ? <span className="ml-2 text-[11px] text-nook-ink-soft">{fmtSize(a.size)}</span> : null}
                </a>
                {canEdit && (
                  <form action={deleteAttachment}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <button type="submit" className="text-xs text-nook-ink-soft hover:text-state-red" title="Șterge">
                      ✕
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <div className="mt-4 space-y-3 border-t border-nook-line/60 pt-4">
            <AttachmentUpload taskId={task.id} />
            <form action={addAttachmentLink} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="taskId" value={task.id} />
              <input
                name="label"
                placeholder="Etichetă (ex. Brief video)"
                className="rounded-full border border-nook-line bg-nook-paper px-3 py-1.5 text-xs focus:border-nook-forest focus:outline-none"
              />
              <input
                name="url"
                type="url"
                required
                placeholder="https://… (Drive, YouTube, WeTransfer)"
                className="min-w-[14rem] flex-1 rounded-full border border-nook-line bg-nook-paper px-3 py-1.5 text-xs focus:border-nook-forest focus:outline-none"
              />
              <button type="submit" className="rounded-full bg-nook-sage px-4 py-1.5 text-xs font-medium text-nook-paper hover:bg-nook-forest">
                + Adaugă link
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Comentarii */}
      <div className="mt-6 rounded-2xl bg-nook-paper p-6 ring-1 ring-nook-line">
        <h2 className="mb-3 font-display text-base font-bold text-nook-forest">
          Comentarii ({task.comments.length})
        </h2>
        {task.comments.length === 0 ? (
          <p className="text-sm italic text-nook-ink-soft">Niciun comentariu încă.</p>
        ) : (
          <ul className="space-y-3">
            {task.comments.map((c) => (
              <li key={c.id} className="rounded-xl bg-nook-paper-warm/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-nook-ink">
                    {c.authorName ?? "—"}
                  </span>
                  <span className="flex items-center gap-2 text-[11px] text-nook-ink-soft">
                    {formatDateTime(c.createdAt)}
                    {canEdit && (
                      <form action={deleteComment}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="taskId" value={task.id} />
                        <button type="submit" className="hover:text-state-red" title="Șterge">
                          ✕
                        </button>
                      </form>
                    )}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-nook-ink">{c.body}</p>
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <form action={addComment} className="mt-4 flex flex-col gap-2 border-t border-nook-line/60 pt-4">
            <input type="hidden" name="taskId" value={task.id} />
            <textarea
              name="body"
              required
              rows={2}
              placeholder="Scrie un comentariu…"
              className="w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
            />
            <div className="flex justify-end">
              <button type="submit" className="rounded-full bg-nook-forest px-5 py-1.5 text-xs font-medium text-nook-paper hover:bg-nook-ink">
                Comentează
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Ștergere task (super-admin + marketing) */}
      {canEdit && (
        <div className="mt-6">
          <form action={deleteTask}>
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              className="text-xs text-nook-ink-soft hover:text-state-red"
            >
              Șterge taskul definitiv
            </button>
          </form>
        </div>
      )}
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-nook-paper-warm/60 p-4 ring-1 ring-nook-line">
      <div className="text-[11px] font-bold uppercase tracking-widest text-nook-ink-soft">{label}</div>
      <div className="mt-1 font-display text-sm font-bold text-nook-ink">{value}</div>
    </div>
  );
}
