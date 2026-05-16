/**
 * Funcții de formatare pentru afișare în UI — totul în limba română.
 */

const dateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("ro-RO", {
  hour: "2-digit",
  minute: "2-digit",
});

const moneyFormatter = new Intl.NumberFormat("ro-RO", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dayLong = new Intl.DateTimeFormat("ro-RO", { weekday: "long" });

export function formatDate(d: Date | string): string {
  return dateFormatter.format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return dateTimeFormatter.format(new Date(d));
}

export function formatTime(d: Date | string): string {
  return timeFormatter.format(new Date(d));
}

export function formatWeekday(d: Date | string): string {
  return dayLong.format(new Date(d));
}

export function formatMoney(amount: number): string {
  return `${moneyFormatter.format(amount)} lei`;
}

export function ageFromBirthDate(birth: Date | string, today = new Date(2026, 4, 16)): number {
  const b = new Date(birth);
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

/** „acum 3 zile", „mâine", „peste 2 săptămâni" — relativ la o referință */
const rtf = new Intl.RelativeTimeFormat("ro-RO", { numeric: "auto" });

export function formatRelativeDate(d: Date | string, now = new Date()): string {
  const date = new Date(d);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) >= 30) {
    const diffMonths = Math.round(diffDays / 30);
    return rtf.format(diffMonths, "month");
  }
  if (Math.abs(diffDays) >= 7) {
    const diffWeeks = Math.round(diffDays / 7);
    return rtf.format(diffWeeks, "week");
  }
  return rtf.format(diffDays, "day");
}
