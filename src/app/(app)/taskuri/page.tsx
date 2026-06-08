import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import {
  PRIORITY_LABEL,
  TASK_CATEGORY_LABEL,
  TASK_TYPE_LABEL,
  type Priority,
  type TaskCategory,
  type TaskType,
} from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth-server";
import { canEdit, isSuperAdmin, visibleTaskCategories } from "@/lib/permissions";
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

const CATEGORY_TONE: Record<TaskCategory, string> = {
  ADMINISTRATIVE: "bg-nook-line text-nook-ink-soft",
  OPERATIONAL: "bg-nook-sage-light/60 text-nook-forest",
  SALES: "bg-nook-terracotta/15 text-nook-terracotta",
  MARKETING: "bg-nook-sand/50 text-nook-ink",
};

export default async function TaskuriPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await getCurrentUser();
  const role = user?.role;
  const allowedCats = visibleTaskCategories(role);
  const editable = canEdit(role);
  const superAdmin = isSuperAdmin(role);
  const showCategoryFilter = allowedCats.length > 1;

  const params = await searchParams;
  const activeCat =
    params.cat && (allowedCats as string[]).includes(params.cat)
      ? (params.cat as TaskCategory)
      : null;

  const categoryWhere = activeCat
    ? { category: activeCat }
    : { category: { in: allowedCats } };

  const [tasks, contacts, categoryCounts] = await Promise.all([
    db.task.findMany({
      where: categoryWhere,
      include: {
        contact: { select: { firstName: true, lastName: true } },
        lead: { select: { id: true, scheduledAt: true, type: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
    }),
    editable
      ? db.contact.findMany({
          select: { id: true, firstName: true, lastName: true },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        })
      : Promise.resolve([]),
    showCategoryFilter
      ? db.task.groupBy({
          by: ["category"],
          where: { status: { not: "DONE" }, category: { in: allowedCats } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const counts: Record<string, number> = {};
  for (const c of categoryCounts) counts[c.category] = c._count._all;
  const totalActive = Object.values(counts).reduce((a, b) => a + b, 0);

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
        description={
          showCategoryFilter
            ? `${todo.length} ${todo.length === 1 ? "task" : "taskuri"} active · ${overdue.length} restante · ${done.length} făcute`
            : `Taskurile operaționale · ${todo.length} active · ${overdue.length} restante`
        }
        action={
          superAdmin ? (
            <form action={runAutomationsAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-nook-sage px-5 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-forest"
              >
                ↻ Rulează automatizările
              </button>
            </form>
          ) : undefined
        }
      />

      {/* Filtru pe tipologie (super-admin + marketing) */}
      {showCategoryFilter && (
        <div className="mt-6">
          <CategoryFilter activeCat={activeCat} counts={counts} total={totalActive} />
        </div>
      )}

      {/* Adăugare task manual — doar conturile care pot edita */}
      {editable && (
        <div className="mt-6">
          <AddTaskForm contacts={contacts} allowedCategories={allowedCats} />
        </div>
      )}

      <div className="mt-8 space-y-8">
        {overdue.length > 0 && (
          <TaskGroup
            title={`Restante (${overdue.length})`}
            tone="red"
            tasks={overdue}
            editable={editable}
            showCategory={showCategoryFilter}
          />
        )}
        <TaskGroup
          title={today.length > 0 ? `Astăzi (${today.length})` : "Astăzi — nimic urgent"}
          tone="forest"
          tasks={today}
          editable={editable}
          showCategory={showCategoryFilter}
          emptyText="Nimic urgent pentru ziua de azi."
        />
        {upcoming.length > 0 && (
          <TaskGroup
            title={`În următoarele zile (${upcoming.length})`}
            tone="sage"
            tasks={upcoming}
            editable={editable}
            showCategory={showCategoryFilter}
          />
        )}
        {done.length > 0 && (
          <TaskGroup
            title={`Făcute (${done.length})`}
            tone="muted"
            tasks={done.slice(0, 10)}
            done
            editable={editable}
            showCategory={showCategoryFilter}
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

function CategoryFilter({
  activeCat,
  counts,
  total,
}: {
  activeCat: TaskCategory | null;
  counts: Record<string, number>;
  total: number;
}) {
  const cats: TaskCategory[] = ["ADMINISTRATIVE", "OPERATIONAL", "SALES", "MARKETING"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-[4.5rem] text-[11px] font-semibold uppercase tracking-wider text-nook-ink-soft">
        Tipologie
      </span>
      <CatChip href="/taskuri" active={!activeCat}>
        Toate{total > 0 && <span className="ml-1 opacity-70">· {total}</span>}
      </CatChip>
      {cats.map((c) => (
        <CatChip key={c} href={`/taskuri?cat=${c}`} active={activeCat === c}>
          {TASK_CATEGORY_LABEL[c]}
          {(counts[c] ?? 0) > 0 && <span className="ml-1 opacity-70">· {counts[c]}</span>}
        </CatChip>
      ))}
    </div>
  );
}

function CatChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-nook-forest text-nook-paper"
          : "bg-nook-paper text-nook-ink-soft ring-1 ring-nook-line hover:text-nook-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function TaskGroup({
  title,
  tone,
  tasks,
  done = false,
  editable,
  showCategory,
  emptyText,
}: {
  title: string;
  tone: "red" | "forest" | "sage" | "muted";
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    category: string;
    priority: string;
    dueDate: Date;
    origin: string;
    status: string;
    contact: { firstName: string; lastName: string } | null;
    lead: { id: string; scheduledAt: Date; type: string } | null;
  }>;
  done?: boolean;
  editable: boolean;
  showCategory: boolean;
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
            <TaskRow
              key={t.id}
              task={t}
              done={done}
              editable={editable}
              showCategory={showCategory}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({
  task,
  done,
  editable,
  showCategory,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    category: string;
    priority: string;
    dueDate: Date;
    origin: string;
    status: string;
    contact: { firstName: string; lastName: string } | null;
  };
  done: boolean;
  editable: boolean;
  showCategory: boolean;
}) {
  const priority = task.priority as Priority;
  const category = task.category as TaskCategory;
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
        <div className="flex items-center gap-2">
          {showCategory && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_TONE[category] ?? CATEGORY_TONE.ADMINISTRATIVE}`}
            >
              {TASK_CATEGORY_LABEL[category] ?? task.category}
            </span>
          )}
          <div
            className={`font-semibold text-nook-ink ${done ? "line-through" : ""}`}
          >
            {task.title}
          </div>
        </div>
        {task.description && (
          <p className="mt-1 whitespace-pre-wrap text-xs text-nook-ink-soft">
            {task.description}
          </p>
        )}
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

      {/* Acțiuni — doar conturile care pot edita */}
      {editable && (
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
      )}
    </li>
  );
}
