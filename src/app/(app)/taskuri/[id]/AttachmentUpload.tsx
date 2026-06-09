"use client";

import { useActionState, useRef, useState } from "react";
import { uploadAttachment, type UploadState } from "./actions";

const initial: UploadState = {};
const MAX = 10 * 1024 * 1024;

export function AttachmentUpload({ taskId }: { taskId: string }) {
  const [state, action, pending] = useActionState(uploadAttachment, initial);
  const [clientError, setClientError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={action}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        const input = formRef.current?.elements.namedItem("file") as HTMLInputElement | null;
        const f = input?.files?.[0];
        if (!f) {
          e.preventDefault();
          setClientError("Alege un fișier.");
          return;
        }
        if (f.size > MAX) {
          e.preventDefault();
          setClientError("Fișier prea mare (max 10MB). Pentru fișiere mari folosește un link mai jos.");
          return;
        }
        setClientError(null);
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input
        type="file"
        name="file"
        className="text-xs text-nook-ink-soft file:mr-2 file:rounded-full file:border-0 file:bg-nook-paper-warm file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-nook-forest hover:file:bg-nook-line"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-nook-forest px-4 py-1.5 text-xs font-medium text-nook-paper hover:bg-nook-ink disabled:opacity-60"
      >
        {pending ? "Se încarcă…" : "↑ Încarcă fișier"}
      </button>
      {(clientError || state.error) && (
        <span className="text-xs text-state-red">{clientError || state.error}</span>
      )}
      {state.ok && !clientError && <span className="text-xs text-nook-forest">✓ Încărcat.</span>}
    </form>
  );
}
