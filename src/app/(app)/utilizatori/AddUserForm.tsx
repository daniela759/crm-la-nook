"use client";

import { useActionState, useState } from "react";
import { addUserAction, type UserActionState } from "./actions";

const initial: UserActionState = {};

export function AddUserForm() {
  const [state, action, pending] = useActionState(addUserAction, initial);
  const [open, setOpen] = useState(false);

  if (!open && !state.generatedPassword) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-nook-forest px-5 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink"
      >
        + Adaugă utilizator
      </button>
    );
  }

  // După succes, afișez parola generată
  if (state.ok && state.generatedPassword) {
    return (
      <div className="rounded-2xl bg-nook-sage-light/40 ring-1 ring-nook-forest/40 p-5">
        <div className="text-[11px] font-bold tracking-widest uppercase text-nook-forest">
          ✓ Cont creat
        </div>
        <p className="mt-2 text-sm text-nook-ink">
          Distribuie utilizatorului parola de mai jos. <strong>Bcrypt e one-way</strong> —
          nu va putea fi recuperată ulterior, dar poți reseta o parolă nouă oricând.
        </p>
        <div className="mt-3 rounded-xl bg-nook-paper p-3 font-mono text-sm select-all">
          {state.generatedPassword}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            // Reset state prin reload pagină — alternativă: separat un Server Action de "dismiss"
            window.location.reload();
          }}
          className="mt-4 rounded-full bg-nook-forest px-5 py-2 text-xs font-medium text-nook-paper hover:bg-nook-ink"
        >
          Am salvat parola, închide
        </button>
      </div>
    );
  }

  const err = state.errors ?? {};

  return (
    <form
      action={action}
      className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-nook-forest">
          Utilizator nou
        </h3>
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
          <span className="text-xs font-medium text-nook-ink-soft">Email *</span>
          <input
            name="email"
            type="email"
            required
            placeholder="numele@email.com"
            className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              err.email
                ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
                : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
            }`}
          />
          {err.email && (
            <span className="mt-1 block text-xs text-state-red">{err.email}</span>
          )}
        </label>
        <label className="block">
          <span className="text-xs font-medium text-nook-ink-soft">Nume (opțional)</span>
          <input
            name="name"
            type="text"
            placeholder="Prenume Nume"
            className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-3 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-medium text-nook-ink-soft">Rol</span>
        <select
          name="role"
          defaultValue="OPERATIONAL"
          className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-3 py-2 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        >
          <option value="OPERATIONAL">Operațional — personal (taskuri, rezervări, calendar)</option>
          <option value="MARKETING">Marketing — agenția (vede tot, doar citește)</option>
          <option value="SUPER_ADMIN">Super-admin — acces total + utilizatori/setări</option>
        </select>
      </label>

      <div className="rounded-xl bg-nook-cream/40 p-3 text-xs text-nook-ink-soft">
        🔐 Parola se generează automat, sigură. Vei vedea parola o singură dată,
        după salvare. Distribuie-i contul utilizatorului direct.
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-nook-forest px-5 text-xs font-medium text-nook-paper hover:bg-nook-ink disabled:opacity-60"
        >
          {pending ? "Se creează…" : "Creează contul"}
        </button>
      </div>
    </form>
  );
}
