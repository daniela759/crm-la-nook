/**
 * Scor comportamental + stadiu pipeline — calculate, NU stocate (conf. spec sec. 8.4).
 *
 * Regulile de scor (din DEFAULT_SCORE_RULES, editabile via Settings):
 *  + booking (5): orice lead creat
 *  + confirmed (10): lead trecut prin CONFIRMED (CURRENT ∈ {CONFIRMED, PRESENT, ABSENT după confirmare})
 *  + visit (20): lead VISIT cu status PRESENT
 *  + eventAttendance (15): lead EVENT cu status PRESENT
 *  + birthdayHeld (30): lead BIRTHDAY cu status PRESENT
 *  + secondVisitWithin30d (10): bonus pe vizite VISIT consecutive < 30 zile
 *  − noShow (15): lead în status ABSENT
 *  − inactivity60d (10): nicio activitate de 60+ zile
 *
 * Pipeline (sec. 4), prioritate de la cel mai avansat:
 *  LOYAL_SUBSCRIBER → SUBSCRIBED → READY_FOR_SUBSCRIPTION → RECURRING_VISITOR
 *  → FIRST_VISIT → NO_SHOW → INACTIVE → CONFIRMED_RESERVATION → LEAD_NEW
 */

import type { ScoreRules } from "@/lib/settings";
import type { PipelineStage } from "@/lib/domain";

export type LeadForScoring = {
  type: string;
  status: string;
  scheduledAt: Date;
  createdAt: Date;
};

export type SubscriptionForScoring = {
  totalEntries: number;
  usedEntries: number;
  purchasedAt: Date;
};

export type ScoreInput = {
  leads: LeadForScoring[];
  subscriptions: SubscriptionForScoring[];
  /** Data de referință pentru inactivitate; default = acum */
  referenceDate?: Date;
};

export function computeScore(input: ScoreInput, rules: ScoreRules): number {
  const ref = input.referenceDate ?? new Date();
  let score = 0;

  for (const lead of input.leads) {
    if (lead.status === "CANCELLED") continue;

    // Creare lead — întotdeauna
    score += rules.booking;

    // Trecut prin CONFIRMED dacă status curent e CONFIRMED sau PRESENT
    // (ABSENT poate veni direct din CONFIRMED, dar nu garantăm — păstrăm conservativ.)
    if (lead.status === "CONFIRMED" || lead.status === "PRESENT") {
      score += rules.confirmed;
    }

    if (lead.status === "PRESENT") {
      if (lead.type === "VISIT") score += rules.visit;
      else if (lead.type === "EVENT") score += rules.eventAttendance;
      else if (lead.type === "BIRTHDAY") score += rules.birthdayHeld;
    }

    if (lead.status === "ABSENT") {
      score += rules.noShow; // negativ
    }
  }

  // Bonus: vizite consecutive < 30 zile
  const visits = input.leads
    .filter((l) => l.type === "VISIT" && l.status === "PRESENT")
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  for (let i = 1; i < visits.length; i++) {
    const diffMs = visits[i].scheduledAt.getTime() - visits[i - 1].scheduledAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays < 30) score += rules.secondVisitWithin30d;
  }

  // Inactivitate
  const lastActivity = findLastActivity(input, ref);
  if (lastActivity) {
    const diffMs = ref.getTime() - lastActivity.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 60) score += rules.inactivity60d; // negativ
  }

  return Math.max(0, score);
}

function findLastActivity(input: ScoreInput, ref: Date): Date | null {
  let last: Date | null = null;
  for (const l of input.leads) {
    // Folosim scheduledAt pentru lead-uri trecute (deja întâmplate)
    if (l.scheduledAt <= ref && (!last || l.scheduledAt > last)) {
      last = l.scheduledAt;
    }
  }
  for (const s of input.subscriptions) {
    if (s.purchasedAt <= ref && (!last || s.purchasedAt > last)) {
      last = s.purchasedAt;
    }
  }
  return last;
}

export function computeStage(input: ScoreInput, score: number, rules: ScoreRules): PipelineStage {
  const ref = input.referenceDate ?? new Date();
  const subs = input.subscriptions;

  // Abonat fidel: ≥ 2 abonamente vreodată cumpărate
  if (subs.length >= 2) return "LOYAL_SUBSCRIBER";
  // Abonat: are un abonament cu intrări rămase
  const hasActiveSub = subs.some((s) => s.usedEntries < s.totalEntries);
  if (hasActiveSub) return "SUBSCRIBED";
  // Pregătit pentru abonament: scor ≥ prag
  if (score >= rules.threshold) return "READY_FOR_SUBSCRIPTION";

  // Vizite reale (VISIT PRESENT) — status-ul PRESENT înseamnă că vizita a avut
  // loc, indiferent dacă data programată e încă în viitor (admin a marcat manual).
  const visits = input.leads.filter(
    (l) => l.type === "VISIT" && l.status === "PRESENT",
  );
  if (visits.length >= 2) return "RECURRING_VISITOR";
  if (visits.length === 1) return "FIRST_VISIT";

  // Ultim lead înregistrat
  const ordered = [...input.leads].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const last = ordered[0];

  if (last?.status === "ABSENT") return "NO_SHOW";

  // Inactivitate
  const lastActivity = findLastActivity(input, ref);
  if (lastActivity) {
    const diffDays = (ref.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 60) return "INACTIVE";
  }

  if (input.leads.some((l) => l.status === "CONFIRMED")) {
    return "CONFIRMED_RESERVATION";
  }

  return "LEAD_NEW";
}

export type ScoreTone = "cold" | "warm" | "ready" | "ambassador";
export function scoreTone(score: number): ScoreTone {
  if (score >= 90) return "ambassador";
  if (score >= 60) return "ready";
  if (score >= 30) return "warm";
  return "cold";
}

export const SCORE_TONE_LABEL: Record<ScoreTone, string> = {
  cold: "Rece",
  warm: "Cald",
  ready: "Pregătit",
  ambassador: "Ambasador",
};
