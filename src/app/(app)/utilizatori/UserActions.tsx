"use client";

import { useActionState, useState } from "react";
import {
  changeRoleAction,
  resetPasswordAction,
  toggleActiveAction,
  type UserActionState,
} from "./actions";

const initial: UserActionState = {};

export function UserRow({
  user,
  currentUserId,
}: {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    active: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  };
  currentUserId: string;
}) {
  const [resetState, resetAction, resetting] = useActionState(
    resetPasswordAction,
    initial,
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const isMe = user.id === currentUserId;

  return (
    <li className="rounded-2xl bg-nook-paper ring-1 ring-nook-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-nook-ink truncate">
            {user.name || user.email}
            {isMe && (
              <span className="ml-2 text-[10px] font-normal text-nook-forest">
                (tu)
              </span>
            )}
          </div>
          {user.name && (
            <div className="text-xs text-nook-ink-soft truncate">{user.email}</div>
          )}
          <div className="mt-1 text-[11px] text-nook-ink-soft">
            Creat {user.createdAt.toLocaleDateString("ro-RO")} ·
            {user.lastLoginAt
              ? ` ultima logare: ${user.lastLoginAt.toLocaleDateString("ro-RO")}`
              : " încă nelogat"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Rol */}
          <form action={changeRoleAction}>
            <input type="hidden" name="id" value={user.id} />
            <select
              name="role"
              defaultValue={user.role}
              disabled={isMe}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset disabled:opacity-60 disabled:cursor-not-allowed ${
                user.role === "ADMIN"
                  ? "bg-nook-terracotta/15 text-nook-terracotta ring-nook-terracotta/40"
                  : "bg-nook-sage-light/40 text-nook-forest ring-nook-sage/40"
              }`}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </form>

          {/* Active toggle */}
          <form action={toggleActiveAction}>
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              disabled={isMe}
              className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-60 disabled:cursor-not-allowed ${
                user.active
                  ? "bg-nook-sage/20 text-nook-forest hover:bg-nook-sage/40"
                  : "bg-state-red/15 text-state-red hover:bg-state-red/30"
              }`}
              title={user.active ? "Dezactivează" : "Reactivează"}
            >
              {user.active ? "Activ" : "Inactiv"}
            </button>
          </form>
        </div>
      </div>

      {/* Reset password */}
      {resetState.ok && resetState.generatedPassword && (
        <div className="mt-3 rounded-xl bg-nook-sage-light/40 ring-1 ring-nook-forest/40 p-3 text-xs">
          <div className="font-semibold text-nook-forest">Parolă nouă generată:</div>
          <div className="mt-1 rounded bg-nook-paper p-2 font-mono select-all">
            {resetState.generatedPassword}
          </div>
          <div className="mt-2 text-nook-ink-soft">
            Distribuie utilizatorului. Reîncarcă pagina după ce ai salvat-o.
          </div>
        </div>
      )}
      {!resetState.ok && (
        <form action={resetAction} className="mt-3">
          <input type="hidden" name="id" value={user.id} />
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-[11px] text-nook-ink-soft hover:text-nook-ink"
            >
              ↻ Resetează parola
            </button>
          ) : (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-nook-ink-soft">Sigur resetezi parola?</span>
              <button
                type="submit"
                disabled={resetting}
                className="rounded-full bg-state-red/15 px-2.5 py-0.5 text-state-red font-medium hover:bg-state-red/30 disabled:opacity-60"
              >
                {resetting ? "Se resetează…" : "Da, generează parolă nouă"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-nook-ink-soft hover:text-nook-ink"
              >
                Anulează
              </button>
            </div>
          )}
        </form>
      )}
    </li>
  );
}
