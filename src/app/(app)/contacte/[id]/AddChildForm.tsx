"use client";

import { useActionState, useState } from "react";
import { addChild, deleteChild, type ContactActionState } from "./actions";

const initial: ContactActionState = {};

type Interest = { id: string; name: string };

export function AddChildForm({
  contactId,
  interests,
}: {
  contactId: string;
  interests: Interest[];
}) {
  const [state, action, pending] = useActionState(addChild, initial);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  if (state.ok && open) {
    setTimeout(() => {
      setOpen(false);
      setSelected([]);
    }, 0);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-nook-paper px-4 py-2 text-xs font-medium text-nook-forest ring-1 ring-nook-line hover:bg-nook-paper-warm"
      >
        + Adaugă copil
      </button>
    );
  }

  const err = state.errors ?? {};

  return (
    <form
      action={action}
      className="rounded-xl bg-nook-paper-warm/40 ring-1 ring-nook-line p-4 space-y-3"
    >
      <input type="hidden" name="contactId" value={contactId} />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-widest uppercase text-nook-terracotta">
          Copil nou
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-nook-ink-soft hover:text-nook-ink"
        >
          Anulează
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-nook-ink-soft">Nume *</span>
          <input
            name="name"
            type="text"
            required
            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              err.name
                ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
                : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
            }`}
          />
          {err.name && <span className="mt-1 block text-xs text-state-red">{err.name}</span>}
        </label>
        <label className="block">
          <span className="text-xs font-medium text-nook-ink-soft">Data nașterii *</span>
          <input
            name="birthDate"
            type="date"
            required
            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              err.birthDate
                ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
                : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
            }`}
          />
          {err.birthDate && <span className="mt-1 block text-xs text-state-red">{err.birthDate}</span>}
        </label>
      </div>

      <div>
        <div className="text-xs font-medium text-nook-ink-soft mb-1.5">Interese</div>
        <div className="flex flex-wrap gap-1.5">
          {interests.map((it) => {
            const checked = selected.includes(it.id);
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
                  name="interestIds"
                  value={it.id}
                  checked={checked}
                  onChange={(e) =>
                    setSelected((prev) =>
                      e.target.checked
                        ? [...prev, it.id]
                        : prev.filter((x) => x !== it.id),
                    )
                  }
                  className="sr-only"
                />
                {it.name}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-nook-forest px-5 text-xs font-medium text-nook-paper hover:bg-nook-ink disabled:opacity-60"
        >
          {pending ? "Se salvează…" : "Adaugă copil"}
        </button>
      </div>
    </form>
  );
}

export function DeleteChildButton({
  childId,
  contactId,
  childName,
}: {
  childId: string;
  contactId: string;
  childName: string;
}) {
  return (
    <form
      action={deleteChild}
      onSubmit={(e) => {
        if (
          !confirm(
            `Ești sigură că vrei să ștergi pe ${childName}? Dacă are rezervări, nu va putea fi șters.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={childId} />
      <input type="hidden" name="contactId" value={contactId} />
      <button
        type="submit"
        className="text-[11px] text-nook-ink-soft hover:text-state-red"
        title="Șterge copilul"
      >
        ×
      </button>
    </form>
  );
}
