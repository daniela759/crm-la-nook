"use client";

import { TASK_STATUSES, TASK_STATUS_LABEL, type TaskStatus } from "@/lib/domain";
import { setTaskDueDate, setTaskStatus } from "./actions";

const STATUS_TONE: Record<TaskStatus, string> = {
  NEW: "bg-nook-sand/50 text-nook-ink ring-nook-sand",
  IN_PROGRESS: "bg-nook-sage/20 text-nook-forest ring-nook-sage/40",
  POSTPONED: "bg-state-yellow/15 text-state-yellow ring-state-yellow/40",
  DONE: "bg-nook-line text-nook-ink-soft ring-nook-line",
};

export function TaskControls({
  taskId,
  status,
  dueDateISO,
}: {
  taskId: string;
  status: string;
  dueDateISO: string;
}) {
  return (
    <div className="flex w-36 shrink-0 flex-col items-stretch gap-1.5">
      <form action={setTaskStatus}>
        <input type="hidden" name="taskId" value={taskId} />
        <select
          name="status"
          defaultValue={status}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={`w-full rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset focus:outline-none ${
            STATUS_TONE[status as TaskStatus] ?? "bg-nook-line text-nook-ink-soft ring-nook-line"
          }`}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </form>
      <form action={setTaskDueDate}>
        <input type="hidden" name="taskId" value={taskId} />
        <input
          type="date"
          name="dueDate"
          defaultValue={dueDateISO}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          title="Deadline (gol = fără termen)"
          className="w-full rounded-full border border-nook-line bg-nook-paper px-3 py-1 text-[11px] text-nook-ink-soft focus:border-nook-forest focus:outline-none"
        />
      </form>
    </div>
  );
}
