"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { createLead, type CreateLeadState } from "./actions";
import { LEAD_TYPES, LEAD_TYPE_LABEL, type LeadType } from "@/lib/domain";
import type { Prices, Schedule } from "@/lib/settings";
import { formatMoney, ageFromBirthDate } from "@/lib/format";

type Option = { id: string; name: string };
type ContactWithChildren = {
  id: string;
  firstName: string;
  lastName: string;
  initialSourceId: string | null;
  children: Array<{ id: string; name: string; birthDate: Date }>;
};

type ChildDraft = {
  uid: string;
  name: string;
  birthDate: string;
};

const initialState: CreateLeadState = {};
const newDraft = (): ChildDraft => ({
  uid: Math.random().toString(36).slice(2),
  name: "",
  birthDate: "",
});

export function LeadForm({
  sources,
  contacts,
  prices,
  schedule,
}: {
  sources: Option[];
  contacts: ContactWithChildren[];
  prices: Prices;
  schedule: Schedule;
}) {
  const [state, formAction, pending] = useActionState(createLead, initialState);

  const [type, setType] = useState<LeadType>("VISIT");
  const [contactChoice, setContactChoice] = useState<"existing" | "new">("existing");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [sourceId, setSourceId] = useState<string>("");
  const [adultsCount, setAdultsCount] = useState<number>(1);
  const [newChildren, setNewChildren] = useState<ChildDraft[]>(() => [newDraft()]);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId),
    [contacts, selectedContactId],
  );

  // Numărul de copii care contează la calcul
  const childrenCount =
    contactChoice === "existing"
      ? selectedChildIds.length
      : newChildren.filter((c) => c.name && c.birthDate).length;

  // Calcul live valoare estimată
  const estimatedValue = useMemo(() => {
    if (type === "VISIT") {
      return childrenCount * prices.childVisit + adultsCount * prices.parentVisit;
    }
    if (type === "BIRTHDAY") return prices.birthday;
    if (type === "EVENT") return prices.eventFee;
    return 0;
  }, [type, childrenCount, adultsCount, prices]);

  // Selectează automat sursa contactului existent
  function handleContactChange(id: string) {
    setSelectedContactId(id);
    setSelectedChildIds([]);
    const c = contacts.find((x) => x.id === id);
    if (c?.initialSourceId) setSourceId(c.initialSourceId);
  }

  function toggleChildSelection(id: string) {
    setSelectedChildIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  function updateNewChild(uid: string, patch: Partial<ChildDraft>) {
    setNewChildren((prev) => prev.map((c) => (c.uid === uid ? { ...c, ...patch } : c)));
  }
  function addNewChild() {
    setNewChildren((prev) => [...prev, newDraft()]);
  }
  function removeNewChild(uid: string) {
    setNewChildren((prev) => (prev.length === 1 ? prev : prev.filter((c) => c.uid !== uid)));
  }

  const err = state.errors ?? {};
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultTime =
    schedule.weekday[0]?.start ?? schedule.weekend[0]?.start ?? "10:00";

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="contactChoice" value={contactChoice} />

      {/* 1. Tip rezervare */}
      <Section title="1. Tip rezervare">
        <div className="flex flex-wrap gap-2">
          {LEAD_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                type === t
                  ? "bg-nook-forest text-nook-paper"
                  : "bg-nook-paper text-nook-ink-soft ring-1 ring-nook-line hover:text-nook-ink"
              }`}
            >
              {LEAD_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </Section>

      {/* 2. Contact */}
      <Section title="2. Contact">
        <div className="flex gap-2">
          <ChoicePill
            label="Contact existent"
            active={contactChoice === "existing"}
            onClick={() => setContactChoice("existing")}
          />
          <ChoicePill
            label="Contact nou"
            active={contactChoice === "new"}
            onClick={() => setContactChoice("new")}
          />
        </div>

        {contactChoice === "existing" ? (
          <div className="mt-4 space-y-4">
            <SelectField
              label="Părintele care face rezervarea"
              name="contactId"
              required
              error={err.contactId}
              value={selectedContactId}
              onChange={(v) => handleContactChange(v)}
              options={contacts.map((c) => ({
                id: c.id,
                name: `${c.lastName} ${c.firstName}`,
              }))}
            />

            {selectedContact && selectedContact.children.length > 0 && (
              <div>
                <span className="text-xs font-medium text-nook-ink-soft">
                  Copii incluși în rezervare
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedContact.children.map((ch) => {
                    const checked = selectedChildIds.includes(ch.id);
                    return (
                      <label
                        key={ch.id}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-colors ${
                          checked
                            ? "bg-nook-forest text-nook-paper"
                            : "bg-nook-paper text-nook-ink-soft ring-1 ring-nook-line hover:text-nook-ink"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="childIds"
                          value={ch.id}
                          checked={checked}
                          onChange={() => toggleChildSelection(ch.id)}
                          className="sr-only"
                        />
                        {ch.name} · {ageFromBirthDate(ch.birthDate)}a
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedContact && selectedContact.children.length === 0 && (
              <p className="text-xs italic text-nook-ink-soft">
                Acest contact nu are copii înregistrați.{" "}
                <Link href="/contacte" className="underline">
                  Adaugă copii din pagina Contacte
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Prenume" name="firstName" required error={err.firstName} />
              <InputField label="Nume" name="lastName" required error={err.lastName} />
              <InputField label="Email" name="email" type="email" required error={err.email} />
              <InputField
                label="Telefon"
                name="phone"
                type="tel"
                required
                error={err.phone}
                placeholder="07__ ___ ___"
              />
            </div>

            <input type="hidden" name="newChildrenCount" value={newChildren.length} />
            <div className="space-y-2">
              <div className="text-xs font-medium text-nook-ink-soft">Copii</div>
              {newChildren.map((child, idx) => (
                <div
                  key={child.uid}
                  className="rounded-xl bg-nook-paper-warm/40 ring-1 ring-nook-line p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-nook-terracotta uppercase">
                      Copil {idx + 1}
                    </span>
                    {newChildren.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeNewChild(child.uid)}
                        className="text-xs text-nook-ink-soft hover:text-state-red"
                      >
                        Șterge
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <InputField
                      label="Nume copil"
                      name={`newChildren[${idx}].name`}
                      value={child.name}
                      onChange={(e) => updateNewChild(child.uid, { name: e.target.value })}
                      error={err[`newChildren.${idx}.name`]}
                    />
                    <InputField
                      label="Data nașterii"
                      name={`newChildren[${idx}].birthDate`}
                      type="date"
                      value={child.birthDate}
                      onChange={(e) => updateNewChild(child.uid, { birthDate: e.target.value })}
                      error={err[`newChildren.${idx}.birthDate`]}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addNewChild}
                className="inline-flex items-center gap-2 rounded-full bg-nook-paper px-3 py-1.5 text-xs font-medium text-nook-forest ring-1 ring-nook-line hover:bg-nook-paper-warm"
              >
                + Mai adaugă un copil
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* 3. Detalii rezervare */}
      <Section title="3. Detalii rezervare">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Data programată"
            name="scheduledDate"
            type="date"
            required
            min={todayStr}
            error={err.scheduledDate}
          />
          <InputField
            label="Ora"
            name="scheduledTime"
            type="time"
            required
            defaultValue={defaultTime}
            error={err.scheduledTime}
          />
          <InputField
            label="Adulți însoțitori"
            name="adultsCount"
            type="number"
            min={0}
            max={20}
            value={adultsCount.toString()}
            onChange={(e) => setAdultsCount(Number(e.target.value || 0))}
            error={err.adultsCount}
          />
          <SelectField
            label="Sursă"
            name="sourceId"
            required
            error={err.sourceId}
            value={sourceId}
            onChange={setSourceId}
            options={sources}
          />
        </div>
        <div className="mt-4">
          <TextareaField label="Note (opțional)" name="notes" rows={3} error={err.notes} />
        </div>
      </Section>

      {/* 4. Valoare estimată */}
      <div className="rounded-2xl bg-nook-sage-light/30 ring-1 ring-nook-sage/40 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-widest text-nook-forest uppercase">
              Valoare estimată
            </div>
            <p className="mt-1 text-xs text-nook-ink-soft">
              {type === "VISIT" &&
                `${childrenCount} ${childrenCount === 1 ? "copil" : "copii"} × ${prices.childVisit} lei + ${adultsCount} ${adultsCount === 1 ? "adult" : "adulți"} × ${prices.parentVisit} lei`}
              {type === "BIRTHDAY" && `Închiriere spațiu 3 ore — preț fix`}
              {type === "EVENT" && `Taxă eveniment — preț fix`}
              {type === "SUBSCRIPTION_INTEREST" &&
                `Interes — nu generează venit direct`}
            </p>
          </div>
          <div className="font-display text-3xl font-extrabold text-nook-forest">
            {formatMoney(estimatedValue)}
          </div>
        </div>
      </div>

      {/* Acțiuni */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href="/rezervari"
          className="inline-flex h-10 items-center px-5 text-sm text-nook-ink-soft hover:text-nook-ink"
        >
          Anulează
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-full bg-nook-forest px-7 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Se salvează…" : "Salvează rezervarea"}
        </button>
      </div>
    </form>
  );
}

// ─── Componente reutilizabile ────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-nook-forest mb-4">{title}</h2>
      {children}
    </section>
  );
}

function ChoicePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-nook-forest text-nook-paper"
          : "bg-nook-paper text-nook-ink-soft ring-1 ring-nook-line hover:text-nook-ink"
      }`}
    >
      {label}
    </button>
  );
}

function InputField({
  label,
  name,
  type = "text",
  required,
  error,
  defaultValue,
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  min?: string | number;
  max?: string | number;
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
        min={min}
        max={max}
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
  required,
  error,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: Option[];
  required?: boolean;
  error?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-nook-ink-soft">
        {label} {required && <span className="text-state-red">*</span>}
      </span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
      {error && <span className="mt-1 block text-xs text-state-red">{error}</span>}
    </label>
  );
}

function TextareaField({
  label,
  name,
  rows,
  error,
}: {
  label: string;
  name: string;
  rows?: number;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-nook-ink-soft">{label}</span>
      <textarea
        name={name}
        rows={rows ?? 3}
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
