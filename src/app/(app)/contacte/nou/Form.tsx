"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createContact, type CreateContactState } from "./actions";

type Option = { id: string; name: string };

type ChildDraft = {
  // identificator local pentru React keys (nu se trimite la server)
  uid: string;
  name: string;
  birthDate: string;
  interestIds: string[];
};

const initialState: CreateContactState = {};

function newDraft(): ChildDraft {
  return {
    uid: Math.random().toString(36).slice(2),
    name: "",
    birthDate: "",
    interestIds: [],
  };
}

export function ContactForm({
  sources,
  interests,
}: {
  sources: Option[];
  interests: Option[];
}) {
  const [state, formAction, pending] = useActionState(createContact, initialState);
  const [children, setChildren] = useState<ChildDraft[]>(() => [newDraft()]);

  function updateChild(uid: string, patch: Partial<ChildDraft>) {
    setChildren((prev) => prev.map((c) => (c.uid === uid ? { ...c, ...patch } : c)));
  }
  function toggleInterest(uid: string, interestId: string) {
    setChildren((prev) =>
      prev.map((c) =>
        c.uid === uid
          ? {
              ...c,
              interestIds: c.interestIds.includes(interestId)
                ? c.interestIds.filter((i) => i !== interestId)
                : [...c.interestIds, interestId],
            }
          : c,
      ),
    );
  }
  function addChild() {
    setChildren((prev) => [...prev, newDraft()]);
  }
  function removeChild(uid: string) {
    setChildren((prev) => (prev.length === 1 ? prev : prev.filter((c) => c.uid !== uid)));
  }

  const err = state.errors ?? {};
  const v = state.values ?? {};

  return (
    <form action={formAction} className="mt-8 space-y-8">
      {/* Datele părintelui */}
      <Section title="Părinte / aparținător">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prenume" name="firstName" required error={err.firstName} defaultValue={v.firstName} />
          <Field label="Nume" name="lastName" required error={err.lastName} defaultValue={v.lastName} />
          <Field label="Email" name="email" type="email" required error={err.email} defaultValue={v.email} />
          <Field label="Telefon" name="phone" type="tel" required error={err.phone} defaultValue={v.phone} placeholder="07__ ___ ___" />
          <div className="sm:col-span-2">
            <Field label="Adresă (opțional)" name="address" error={err.address} defaultValue={v.address} />
          </div>
          <div className="sm:col-span-2">
            <SelectField
              label="Sursă"
              name="initialSourceId"
              required
              error={err.initialSourceId}
              defaultValue={v.initialSourceId}
              options={sources}
              hint="De unde a aflat de Nook? Important pentru a măsura canalele care aduc clienți."
            />
          </div>
          <div className="sm:col-span-2">
            <TextareaField label="Note (opțional)" name="notes" rows={3} error={err.notes} defaultValue={v.notes} />
          </div>
        </div>
      </Section>

      {/* Copiii */}
      <Section
        title="Copii"
        description="Datele copilului se stochează aici o singură dată. La fiecare rezervare îl vei selecta din listă."
      >
        <input type="hidden" name="childrenCount" value={children.length} />
        <div className="space-y-3">
          {children.map((child, idx) => (
            <div
              key={child.uid}
              className="rounded-2xl bg-nook-paper-warm/40 ring-1 ring-nook-line p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-nook-terracotta uppercase">
                  Copil {idx + 1}
                </span>
                {children.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChild(child.uid)}
                    className="text-xs text-nook-ink-soft hover:text-state-red"
                  >
                    Șterge
                  </button>
                )}
              </div>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nume copil"
                  name={`children[${idx}].name`}
                  value={child.name}
                  onChange={(e) => updateChild(child.uid, { name: e.target.value })}
                  error={err[`children.${idx}.name`]}
                />
                <Field
                  label="Data nașterii"
                  name={`children[${idx}].birthDate`}
                  type="date"
                  value={child.birthDate}
                  onChange={(e) => updateChild(child.uid, { birthDate: e.target.value })}
                  error={err[`children.${idx}.birthDate`]}
                />
              </div>

              <div className="mt-3">
                <div className="text-xs font-medium text-nook-ink-soft mb-2">
                  Interese (selectează una sau mai multe)
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((it) => {
                    const checked = child.interestIds.includes(it.id);
                    return (
                      <label
                        key={it.id}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                          checked
                            ? "bg-nook-forest text-nook-paper"
                            : "bg-nook-paper text-nook-ink-soft ring-1 ring-nook-line hover:text-nook-ink"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={`children[${idx}].interestIds`}
                          value={it.id}
                          checked={checked}
                          onChange={() => toggleInterest(child.uid, it.id)}
                          className="sr-only"
                        />
                        {it.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addChild}
            className="inline-flex items-center gap-2 rounded-full bg-nook-paper px-4 py-2 text-sm font-medium text-nook-forest ring-1 ring-nook-line hover:bg-nook-paper-warm"
          >
            + Mai adaugă un copil
          </button>
        </div>
      </Section>

      {/* Acțiuni */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href="/contacte"
          className="inline-flex h-10 items-center px-5 text-sm text-nook-ink-soft hover:text-nook-ink"
        >
          Anulează
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-full bg-nook-forest px-7 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Se salvează…" : "Salvează contactul"}
        </button>
      </div>
    </form>
  );
}

// ─── Mici componente de form ───────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-lg font-bold text-nook-forest">{title}</h2>
        {description && (
          <p className="mt-1 text-xs text-nook-ink-soft">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

type BaseFieldProps = {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
};

function Field({
  label,
  name,
  error,
  required,
  type = "text",
  defaultValue,
  value,
  onChange,
  placeholder,
}: BaseFieldProps & {
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
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
        defaultValue={onChange ? undefined : defaultValue}
        value={onChange ? value : undefined}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
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
  options,
  error,
  required,
  defaultValue,
  hint,
}: BaseFieldProps & {
  options: Option[];
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-nook-ink-soft">
        {label} {required && <span className="text-state-red">*</span>}
      </span>
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
          error
            ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
            : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
        }`}
      >
        <option value="" disabled>
          — Selectează —
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {hint && !error && (
        <span className="mt-1 block text-xs text-nook-ink-soft">{hint}</span>
      )}
      {error && <span className="mt-1 block text-xs text-state-red">{error}</span>}
    </label>
  );
}

function TextareaField({
  label,
  name,
  rows = 3,
  error,
  defaultValue,
}: BaseFieldProps & {
  rows?: number;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-nook-ink-soft">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
          error
            ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
            : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-state-red">{error}</span>}
    </label>
  );
}
