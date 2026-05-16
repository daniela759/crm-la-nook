import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import {
  PRIORITY_LABEL,
  TASK_TYPE_LABEL,
  type Priority,
  type TaskType,
} from "@/lib/domain";
import { formatDate } from "@/lib/format";
import {
  completeTask,
  reopenTask,
  runAutomationsAction,
  snoozeTask,
} from "./actions";
import { AddTaskForm } from "./AddTaskForm";

const PRIORITY_TONE: Record<Priority, string> = {
  HIGH: "bg-state-red/15 text-state-red ring-state-red/40",
  MEDIUM: "bg-state-yellow/15 text-state-yellow ring-state-yellow/40",
  LOW: "bg-nook-line text-nook-ink-soft ring-nook-line",
};

export default async function TaskuriPage() {
  const [tasks, contacts] = await Promise.all([
    db.task.findMany({
      include: {
        contact: { select: { firstName: true, lastName: true } },
        lead: { select: { id: true, scheduledAt: true, type: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
    }),
    db.contact.findMany({
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const todo = tasks.filter((t) => t.status !== "DONE");
  const done = tasks.filter((t) => t.status === "DONE");

  const now = new Date();
  const overdue = todo.filter((t) => t.dueDate < now);
  const today = todo.filter((t) => sameDay(t.dueDate, now) && t.dueDate >= now);
  const upcoming = todo.filter((t) => t.dueDate > now && !sameDay(t.dueDate, now));

  return (
    <PageContainer>
      <PageHeader
        title="Taskuri zilnice"
        description={`${todo.length} ${todo.length === 1 ? "task" : "taskuri"} active · ${overdue.length} restante · ${done.length} făcute`}
        action={
          <form action={runAutomationsAction}>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-nook-sage px-5 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-forest"
            >
              ↻ Rulează automatizările
            </button>
          </form>
        }
      />

      {/* Adăugare task manual */}
      <div className="mt-6">
        <AddTaskForm contacts={contacts} />
      </div>

      <div className="mt-8 space-y-8">
        {overdue.length > 0 && (
          <TaskGroup
            title={`Restante (${overdue.length})`}
            tone="red"
            tasks={overdue}
          />
        )}
        <TaskGroup
          title={today.length > 0 ? `Astăzi (${today.length})` : "Astăzi — nimic urgent"}
          tone="forest"
          tasks={today}
          emptyText="Nimic urgent pentru ziua de azi. Verifică Rezervările sau adaugă un task manual."
        />
        {upcoming.length > 0 && (
          <TaskGroup title={`În următoarele zile (${upcoming.length})`} tone="sage" tasks={upcoming} />
        )}
        {done.length > 0 && (
          <TaskGroup
            title={`Făcute (${done.length})`}
            tone="muted"
            tasks={done.slice(0, 10)}
            done
          />
        )}
      </div>
    </PageContainer>
  );
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function TaskGroup({
  title,
  tone,
  tasks,
  done = false,
  emptyText,
}: {
  title: string;
  tone: "red" | "forest" | "sage" | "muted";
  tasks: Array<{
    id: string;
    title: string;
    type: string;
    priority: string;
    dueDate: Date;
    origin: string;
    status: string;
    contact: { firstName: string; lastName: string } | null;
    lead: { id: string; scheduledAt: Date; type: string } | null;
  }>;
  done?: boolean;
  emptyText?: string;
}) {
  const toneClasses = {
    red: "text-state-red",
    forest: "text-nook-forest",
    sage: "text-nook-sage",
    muted: "text-nook-ink-soft",
  };
  return (
    <div>
      <h2
        className={`font-display text-sm font-bold tracking-widest uppercase mb-3 ${toneClasses[tone]}`}
      >
        {title}
      </h2>
      {tasks.length === 0 && emptyText ? (
        <p className="text-sm italic text-nook-ink-soft">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} done={done} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({
  task,
  done,
}: {
  task: {
    id: string;
    title: string;
    type: string;
    priority: string;
    dueDate: Date;
    origin: string;
    status: string;
    contact: { firstName: string; lastName: string } | null;
  };
  done: boolean;
}) {
  const priority = task.priority as Priority;
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl bg-nook-paper ring-1 ring-nook-line p-4 ${done ? "opacity-60" : ""}`}
    >
      {/* Indicator prioritate */}
      <span
        className={`shrink-0 inline-flex items-center justify-center rounded-full ring-1 ring-inset h-6 w-6 text-[10px] font-bold ${PRIORITY_TONE[priority] ?? PRIORITY_TONE.MEDIUM}`}
        title={PRIORITY_LABEL[priority] ?? task.priority}
      >
        {priority === "HIGH" ? "!" : priority === "MEDIUM" ? "•" : "·"}
      </span>

      <div className="flex-1 min-w-0">
        <div
          className={`font-semibold text-nook-ink ${done ? "line-through" : ""}`}
        >
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-nook-ink-soft">
          <span>{TASK_TYPE_LABEL[task.type as TaskType] ?? task.type}</span>
          <span>·</span>
          <span>Scadent {formatDate(task.dueDate)}</span>
          {task.contact && (
            <>
              <span>·</span>
              <span>
                {task.contact.lastName} {task.contact.firstName}
              </span>
            </>
          )}
          <span>·</span>
          <span className="uppercase tracking-wider">
            {task.origin === "AUTO" ? "auto" : "manual"}
          </span>
        </div>
      </div>

      {/* Acțiuni */}
      <div className="flex shrink-0 gap-1.5">
        {done ? (
          <form action={reopenTask}>
            <input type="hidden" name="taskId" value={task.id} />
            <button
              type="submit"
              className="rounded-full px-3 py-1 text-xs text-nook-ink-soft hover:text-nook-ink hover:bg-nook-paper-warm"
            >
              ↶ Redeschide
            </button>
          </form>
        ) : (
          <>
            <form action={snoozeTask}>
              <input type="hidden" name="taskId" value={task.id} />
              <button
                type="submit"
                className="rounded-full px-3 py-1 text-xs text-nook-ink-soft hover:text-nook-ink hover:bg-nook-paper-warm"
                title="Amână cu o zi"
              >
                +1z
              </button>
            </form>
            <form action={completeTask}>
              <input type="hidden" name="taskId" value={task.id} />
              <button
                type="submit"
                className="rounded-full bg-nook-forest px-3 py-1 text-xs font-medium text-nook-paper hover:bg-nook-ink"
              >
                ✓ Făcut
              </button>
            </form>
          </>
        )}
      </div>
    </li>
  );
}
