"use client";

import { useActionState, useState } from "react";
import { updateContact, type ContactActionState } from "./actions";

const initial: ContactActionState = {};

type Source = { id: string; name: string };
type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  notes: string | null;
  initialSourceId: string | null;
};

export function EditContactForm({
  contact,
  sources,
}: {
  contact: Contact;
  sources: Source[];
}) {
  const [state, action, pending] = useActionState(updateContact, initial);
  const [editing, setEditing] = useState(false);

  const err = state.errors ?? {};

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full bg-nook-paper px-4 py-2 text-xs font-medium text-nook-forest ring-1 ring-nook-line hover:bg-nook-paper-warm"
      >
        ✎ Editează datele
      </button>
    );
  }

  if (state.ok) {
    setTimeout(() => setEditing(false), 0);
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={contact.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Prenume" name="firstName" defaultValue={contact.firstName} error={err.firstName} required />
        <Field label="Nume" name="lastName" defaultValue={contact.lastName} error={err.lastName} required />
        <Field label="Email" name="email" type="email" defaultValue={contact.email} error={err.email} required />
        <Field label="Telefon" name="phone" type="tel" defaultValue={contact.phone} error={err.phone} required />
      </div>
      <Field
        label="Adresă (opțional)"
        name="address"
        defaultValue={contact.address ?? ""}
        error={err.address}
      />
      <label className="block">
        <span className="text-xs font-medium text-nook-ink-soft">Sursă</span>
        <select
          name="initialSourceId"
          defaultValue={contact.initialSourceId ?? ""}
          className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
            err.initialSourceId
              ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
              : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
          }`}
        >
          <option value="" disabled>
            — Selectează —
          </option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {err.initialSourceId && (
          <span className="mt-1 block text-xs text-state-red">{err.initialSourceId}</span>
        )}
      </label>
      <label className="block">
        <span className="text-xs font-medium text-nook-ink-soft">Note</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={contact.notes ?? ""}
          className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-3 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-4 text-xs text-nook-ink-soft hover:text-nook-ink"
        >
          Anulează
        </button>
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

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
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
        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
          error
            ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
            : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-state-red">{error}</span>}
    </label>
  );
}
