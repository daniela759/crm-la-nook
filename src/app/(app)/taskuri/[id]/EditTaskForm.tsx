"use client";

import { useActionState, useState } from "react";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
} from "@/lib/domain";
import { updateTask, type EditState } from "./actions";

const initial: EditState = {};

export function EditTaskForm({
  task,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    priority: string;
    status: string;
    dueDateISO: string;
  };
}) {
  const [state, action, pending] = useActionState(updateTask, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-nook-paper px-4 py-2 text-xs font-medium text-nook-forest ring-1 ring-nook-line hover:bg-nook-paper-warm"
      >
        ✎ Editează taskul
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl bg-nook-paper p-5 ring-1 ring-nook-line">
      <input type="hidden" name="taskId" value={task.id} />
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-nook-forest">Editează taskul</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-nook-ink-soft hover:text-nook-ink">
          Închide
        </button>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-nook-ink-soft">Titlu *</span>
        <input
          name="title"
          defaultValue={task.title}
          required
          className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-nook-ink-soft">Descriere</span>
        <textarea
          name="description"
          defaultValue={task.description ?? ""}
          rows={5}
          className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select label="Tipologie" name="category" defaultValue={task.category}
          options={TASK_CATEGORIES.map((c) => ({ value: c, label: TASK_CATEGORY_LABEL[c] }))} />
        <Select label="Status" name="status" defaultValue={task.status}
          options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABEL[s] }))} />
        <Select label="Prioritate" name="priority" defaultValue={task.priority}
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))} />
        <label className="block">
          <span className="text-xs font-medium text-nook-ink-soft">Deadline (opțional)</span>
          <input
            type="date"
            name="dueDate"
            defaultValue={task.dueDateISO}
            className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
          />
        </label>
      </div>

      {state.error && <p className="text-xs text-state-red">{state.error}</p>}
      {state.ok && <p className="text-xs text-nook-forest">✓ Salvat.</p>}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-nook-forest px-5 text-xs font-medium text-nook-paper hover:bg-nook-ink disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Salvează"}
        </button>
      </div>
    </form>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-nook-ink-soft">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
