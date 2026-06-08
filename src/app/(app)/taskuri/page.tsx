import Link from "next/link";
import { db } from "@/lib/db";
import { PageContainer, PageHeader } from "@/components/PageHeader";
import {
  PRIORITY_LABEL,
  TASK_CATEGORY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
  TASK_TYPE_LABEL,
  type Priority,
  type TaskCategory,
  type TaskStatus,
  type TaskType,
} from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth-server";
import { canManageTasks, isSuperAdmin, visibleTaskCategories } from "@/lib/permissions";
import { runAutomationsAction } from "./actions";
import { AddTaskForm } from "./AddTaskForm";
import { TaskControls } from "./TaskControls";

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

const STATUS_HEADING_TONE: Record<TaskStatus, string> = {
  NEW: "text-nook-forest",
  IN_PROGRESS: "text-nook-sage",
  POSTPONED: "text-state-yellow",
  DONE: "text-nook-ink-soft",
};

export default async function TaskuriPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await getCurrentUser();
  const role = user?.role;
  const allowedCats = visibleTaskCategories(role);
  const manage = canManageTasks(role);
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
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    }),
    manage
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

  const openCount = tasks.filter((t) => t.status !== "DONE").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <PageContainer>
      <PageHeader
        title="Taskuri"
        description={
          showCategoryFilter
            ? `${openCount} ${openCount === 1 ? "task activ" : "taskuri active"} · ${doneCount} finalizate`
            : `Taskurile operaționale · ${openCount} active`
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

      {/* Adăugare task manual — super-admin, marketing și operational */}
      {manage && (
        <div className="mt-6">
          <AddTaskForm contacts={contacts} allowedCategories={allowedCats} />
        </div>
      )}

      {openCount === 0 && doneCount === 0 ? (
        <p className="mt-8 text-sm italic text-nook-ink-soft">
          Niciun task încă. {manage ? "Adaugă unul cu butonul de mai sus." : ""}
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {TASK_STATUSES.map((status) => {
            const group = tasks.filter((t) => t.status === status);
            if (group.length === 0) return null;
            const shown = status === "DONE" ? group.slice(0, 15) : group;
            return (
              <StatusGroup
                key={status}
                status={status}
                count={group.length}
                tasks={shown}
                manage={manage}
                showCategory={showCategoryFilter}
              />
            );
          })}
        </div>
      )}
    </PageContainer>
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

type TaskRowData = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  priority: string;
  status: string;
  dueDate: Date | null;
  origin: string;
  contact: { firstName: string; lastName: string } | null;
};

function StatusGroup({
  status,
  count,
  tasks,
  manage,
  showCategory,
}: {
  status: TaskStatus;
  count: number;
  tasks: TaskRowData[];
  manage: boolean;
  showCategory: boolean;
}) {
  return (
    <div>
      <h2
        className={`mb-3 font-display text-sm font-bold uppercase tracking-widest ${STATUS_HEADING_TONE[status]}`}
      >
        {TASK_STATUS_LABEL[status]} ({count})
      </h2>
      <ul className="space-y-2">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} manage={manage} showCategory={showCategory} />
        ))}
      </ul>
    </div>
  );
}

function TaskRow({
  task,
  manage,
  showCategory,
}: {
  task: TaskRowData;
  manage: boolean;
  showCategory: boolean;
}) {
  const priority = task.priority as Priority;
  const category = task.category as TaskCategory;
  const done = task.status === "DONE";
  const overdue = task.dueDate && task.dueDate < new Date() && !done;
  return (
    <li
      className={`flex items-start gap-3 rounded-2xl bg-nook-paper p-4 ring-1 ring-nook-line ${done ? "opacity-60" : ""}`}
    >
      <span
        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1 ring-inset ${PRIORITY_TONE[priority] ?? PRIORITY_TONE.MEDIUM}`}
        title={PRIORITY_LABEL[priority] ?? task.priority}
      >
        {priority === "HIGH" ? "!" : priority === "MEDIUM" ? "•" : "·"}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {showCategory && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_TONE[category] ?? CATEGORY_TONE.ADMINISTRATIVE}`}
            >
              {TASK_CATEGORY_LABEL[category] ?? task.category}
            </span>
          )}
          <div className={`font-semibold text-nook-ink ${done ? "line-through" : ""}`}>
            {task.title}
          </div>
        </div>
        {task.description && (
          <p className="mt-1 whitespace-pre-wrap text-xs text-nook-ink-soft">
            {task.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-nook-ink-soft">
          <span>{TASK_TYPE_LABEL[task.type as TaskType] ?? task.type}</span>
          <span>·</span>
          <span className={overdue ? "font-semibold text-state-red" : ""}>
            {task.dueDate ? `Scadent ${formatDate(task.dueDate)}` : "Fără termen"}
          </span>
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

      {manage && (
        <TaskControls
          taskId={task.id}
          status={task.status}
          dueDateISO={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : ""}
        />
      )}
    </li>
  );
}
