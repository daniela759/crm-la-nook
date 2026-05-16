"use client";

import { deleteContact } from "./actions";

export function DeleteContactButton({
  contactId,
  contactName,
  disabled,
  disabledReason,
}: {
  contactId: string;
  contactName: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  if (disabled) {
    return (
      <span
        title={disabledReason ?? "Nu poate fi șters"}
        className="inline-flex items-center rounded-full bg-nook-line/60 px-4 py-2 text-xs font-medium text-nook-ink-soft cursor-not-allowed"
      >
        🗑 Șterge
      </span>
    );
  }
  return (
    <form
      action={deleteContact}
      onSubmit={(e) => {
        if (
          !confirm(
            `Ești sigură că vrei să ștergi pe ${contactName}? Această acțiune nu poate fi anulată.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={contactId} />
      <button
        type="submit"
        className="rounded-full bg-state-red/10 px-4 py-2 text-xs font-medium text-state-red hover:bg-state-red/20"
      >
        🗑 Șterge contact
      </button>
    </form>
  );
}
