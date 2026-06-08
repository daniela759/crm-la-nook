"use client";

import { useActionState, useState } from "react";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  TASK_CATEGORY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
  type TaskCategory,
} from "@/lib/domain";
import { addManualTask, type AddTaskState } from "./actions";

const initial: AddTaskState = {};

export function AddTaskForm({
  contacts,
  allowedCategories,
}: {
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  allowedCategories: TaskCategory[];
}) {
  const [state, action, pending] = useActionState(addManualTask, initial);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-nook-paper px-4 py-2 text-xs font-medium text-nook-forest ring-1 ring-nook-line hover:bg-nook-paper-warm"
      >
        + Adaugă task manual
      </button>
    );
  }

  // După succes, închidem form-ul (next-render după revalidate)
  if (state.ok) {
    setTimeout(() => setOpen(false), 0);
  }

  const err = state.errors ?? {};

  return (
    <form
      action={action}
      className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-nook-forest">
          Task nou
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-nook-ink-soft hover:text-nook-ink"
        >
          Anulează
        </button>
      </div>

      <Field
        label="Ce trebuie făcut?"
        name="title"
        required
        error={err.title}
        placeholder="ex. Sună mama Anei pentru ziua de naștere"
      />

      <label className="block">
        <span className="text-xs font-medium text-nook-ink-soft">
          Detalii (opțional)
        </span>
        <textarea
          name="description"
          rows={3}
          placeholder="Context, pași, cine ce face…"
          className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
      </label>

      {allowedCategories.length <= 1 && (
        <input type="hidden" name="category" value={allowedCategories[0] ?? "OPERATIONAL"} />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {allowedCategories.length > 1 && (
          <SelectField
            label="Tipologie"
            name="category"
            defaultValue="OPERATIONAL"
            options={allowedCategories.map((c) => ({
              value: c,
              label: TASK_CATEGORY_LABEL[c],
            }))}
          />
        )}
        <SelectField
          label="Status"
          name="status"
          defaultValue="NEW"
          options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABEL[s] }))}
        />
        <SelectField
          label="Prioritate"
          name="priority"
          defaultValue="MEDIUM"
          options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))}
        />
        <Field
          label="Deadline (opțional)"
          name="dueDate"
          type="date"
          error={err.dueDate}
        />
        <input type="hidden" name="type" value="OTHER" />
      </div>

      <SelectField
        label="Contact (opțional)"
        name="contactId"
        defaultValue=""
        options={[
          { value: "", label: "— Niciunul —" },
          ...contacts.map((c) => ({
            value: c.id,
            label: `${c.lastName} ${c.firstName}`,
          })),
        ]}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-nook-forest px-5 text-xs font-medium text-nook-paper hover:bg-nook-ink disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Salvează task-ul"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  error,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-nook-ink-soft">
        {label} {required && <span className="text-state-red">*</span>}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
            : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-state-red">{error}</span>}
    </label>
  );
}

function SelectField({
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
