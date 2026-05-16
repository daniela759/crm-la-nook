"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { sellSubscription, type SellSubscriptionState } from "./actions";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  SUBSCRIPTION_ENTRIES,
  SUBSCRIPTION_TYPES,
  SUBSCRIPTION_TYPE_LABEL,
  type PaymentMethod,
  type SubscriptionType,
} from "@/lib/domain";
import type { Prices } from "@/lib/settings";
import { formatMoney } from "@/lib/format";

const initial: SellSubscriptionState = {};

export function SellSubscriptionForm({
  contacts,
  prices,
}: {
  contacts: Array<{ id: string; firstName: string; lastName: string }>;
  prices: Prices;
}) {
  const [state, formAction, pending] = useActionState(sellSubscription, initial);

  const [contactId, setContactId] = useState<string>("");
  const [type, setType] = useState<SubscriptionType>("ENTRIES_8");
  const [payment, setPayment] = useState<PaymentMethod>("CARD");

  const defaultPrice = useMemo(
    () =>
      type === "ENTRIES_8" ? prices.subscription8 : prices.subscription4,
    [type, prices],
  );

  const err = state.errors ?? {};

  return (
    <form action={formAction} className="mt-8 space-y-8">
      <Section title="1. Contact">
        <label className="block">
          <span className="text-xs font-medium text-nook-ink-soft">
            Cui îi vinzi abonamentul? <span className="text-state-red">*</span>
          </span>
          <select
            name="contactId"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              err.contactId
                ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
                : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
            }`}
          >
            <option value="" disabled>
              — Selectează contactul —
            </option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.lastName} {c.firstName}
              </option>
            ))}
          </select>
          {err.contactId && (
            <span className="mt-1 block text-xs text-state-red">
              {err.contactId}
            </span>
          )}
        </label>
      </Section>

      <Section title="2. Tip abonament">
        <input type="hidden" name="type" value={type} />
        <div className="grid gap-3 sm:grid-cols-2">
          {SUBSCRIPTION_TYPES.map((t) => {
            const entries = SUBSCRIPTION_ENTRIES[t];
            const price =
              t === "ENTRIES_8" ? prices.subscription8 : prices.subscription4;
            const pricePerEntry = price / entries;
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`text-left rounded-2xl p-5 ring-1 transition-all ${
                  active
                    ? "bg-nook-forest text-nook-paper ring-nook-forest"
                    : "bg-nook-paper text-nook-ink ring-nook-line hover:ring-nook-forest/60"
                }`}
              >
                <div
                  className={`text-[11px] font-bold tracking-widest uppercase ${active ? "opacity-70" : "text-nook-terracotta"}`}
                >
                  {SUBSCRIPTION_TYPE_LABEL[t]}
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold">
                  {formatMoney(price)}
                </div>
                <div
                  className={`mt-1 text-xs ${active ? "opacity-80" : "text-nook-ink-soft"}`}
                >
                  {pricePerEntry.toFixed(0)} lei / intrare
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="3. Plată">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-nook-ink-soft">
              Preț încasat (lei)
            </span>
            <input
              name="pricePaidOverride"
              type="number"
              min="0"
              defaultValue={defaultPrice}
              key={defaultPrice}
              className={`mt-1 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                err.pricePaidOverride
                  ? "border-state-red bg-state-red/5 focus:ring-state-red/20"
                  : "border-nook-line bg-nook-paper focus:border-nook-forest focus:ring-nook-forest/20"
              }`}
            />
            <span className="mt-1 block text-[11px] text-nook-ink-soft">
              Modifică dacă acorzi reducere
            </span>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-nook-ink-soft">
              Metodă de plată
            </span>
            <select
              name="paymentMethod"
              value={payment}
              onChange={(e) => setPayment(e.target.value as PaymentMethod)}
              className="mt-1 w-full rounded-xl border border-nook-line bg-nook-paper px-4 py-2.5 text-sm focus:border-nook-forest focus:outline-none focus:ring-2 focus:ring-nook-forest/20"
            >
              {PAYMENT_METHODS.map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_METHOD_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Section>

      {/* Sumar */}
      <div className="rounded-2xl bg-nook-sage-light/30 ring-1 ring-nook-sage/40 p-5">
        <div className="text-[11px] font-bold tracking-widest uppercase text-nook-forest">
          Sumar
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li className="flex justify-between">
            <span className="text-nook-ink-soft">Tip</span>
            <span className="font-semibold text-nook-ink">
              {SUBSCRIPTION_TYPE_LABEL[type]}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-nook-ink-soft">Preț</span>
            <span className="font-semibold text-nook-ink">
              {formatMoney(defaultPrice)}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-nook-ink-soft">Metodă plată</span>
            <span className="font-semibold text-nook-ink">
              {PAYMENT_METHOD_LABEL[payment]}
            </span>
          </li>
        </ul>
      </div>

      {/* Acțiuni */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Link
          href="/abonamente"
          className="inline-flex h-10 items-center px-5 text-sm text-nook-ink-soft hover:text-nook-ink"
        >
          Anulează
        </Link>
        <button
          type="submit"
          disabled={pending || !contactId}
          className="inline-flex h-10 items-center rounded-full bg-nook-forest px-7 text-sm font-medium text-nook-paper transition-colors hover:bg-nook-ink disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? "Se înregistrează…" : "Înregistrează vânzarea"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-nook-forest mb-4">{title}</h2>
      {children}
    </section>
  );
}
