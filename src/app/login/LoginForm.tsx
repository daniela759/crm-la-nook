"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="from" value={from} />

      <label className="block">
        <span className="text-xs font-medium text-nook-ink-soft">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="numele@email.com"
          className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2.5 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-nook-ink-soft">Parolă</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2.5 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
        />
      </label>

      {state.error && (
        <div className="rounded-xl bg-state-red/10 px-4 py-2.5 text-sm text-state-red ring-1 ring-state-red/30">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full inline-flex h-11 items-center justify-center rounded-full bg-nook-forest px-7 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Se verifică…" : "Intră în aplicație"}
      </button>
    </form>
  );
}
