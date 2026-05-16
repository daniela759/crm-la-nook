import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-nook-line pb-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-nook-forest tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm sm:text-base text-nook-ink-soft max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">{children}</div>
  );
}

export function ConstructionNotice({
  stage,
  description,
}: {
  stage: string;
  description: string;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-nook-line bg-nook-paper-warm/50 p-8 text-center">
      <span className="inline-block rounded-full bg-nook-terracotta/10 px-3 py-1 text-xs font-bold tracking-widest text-nook-terracotta uppercase">
        În construcție
      </span>
      <h3 className="mt-4 font-display text-xl font-bold text-nook-forest">
        {stage}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-nook-ink-soft">
        {description}
      </p>
    </div>
  );
}
