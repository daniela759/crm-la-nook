/**
 * Constante de domeniu pentru Nook CRM.
 * Sursa de adevăr pentru toate valorile enum-like și etichetele în română afișate în UI.
 * Aliniat cu specul „Nook CRM — Structură și Specificații" v1.0.
 */

// ─── Lead type ──────────────────────────────────────────────────────────────
export const LEAD_TYPES = ["VISIT", "BIRTHDAY", "EVENT", "SUBSCRIPTION_INTEREST"] as const;
export type LeadType = (typeof LEAD_TYPES)[number];
export const LEAD_TYPE_LABEL: Record<LeadType, string> = {
  VISIT: "Vizită",
  BIRTHDAY: "Zi de naștere",
  EVENT: "Eveniment",
  SUBSCRIPTION_INTEREST: "Interes abonament",
};

// ─── Lead status ────────────────────────────────────────────────────────────
export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "CONFIRMED",
  "PRESENT",
  "ABSENT",
  "CANCELLED",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Nou",
  CONTACTED: "Contactat",
  CONFIRMED: "Confirmat",
  PRESENT: "Prezent",
  ABSENT: "Absent",
  CANCELLED: "Anulat",
};

// ─── Subscription type ──────────────────────────────────────────────────────
export const SUBSCRIPTION_TYPES = ["ENTRIES_8", "ENTRIES_4"] as const;
export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];
export const SUBSCRIPTION_TYPE_LABEL: Record<SubscriptionType, string> = {
  ENTRIES_8: "8 intrări",
  ENTRIES_4: "4 intrări",
};
export const SUBSCRIPTION_ENTRIES: Record<SubscriptionType, number> = {
  ENTRIES_8: 8,
  ENTRIES_4: 4,
};

// ─── Revenue type ───────────────────────────────────────────────────────────
export const REVENUE_TYPES = [
  "CHILD_VISIT",
  "PARENT_VISIT",
  "BIRTHDAY",
  "EVENT",
  "SUBSCRIPTION",
] as const;
export type RevenueType = (typeof REVENUE_TYPES)[number];
export const REVENUE_TYPE_LABEL: Record<RevenueType, string> = {
  CHILD_VISIT: "Vizită copil",
  PARENT_VISIT: "Vizită părinte",
  BIRTHDAY: "Zi de naștere",
  EVENT: "Eveniment",
  SUBSCRIPTION: "Abonament",
};

// ─── Transaction status ─────────────────────────────────────────────────────
export const TRANSACTION_STATUSES = ["POTENTIAL", "CONFIRMED", "COLLECTED"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export const TRANSACTION_STATUS_LABEL: Record<TransactionStatus, string> = {
  POTENTIAL: "Potențial",
  CONFIRMED: "Confirmat",
  COLLECTED: "Încasat",
};

// ─── Payment method ─────────────────────────────────────────────────────────
export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  TRANSFER: "Transfer bancar",
};

// ─── Task type ──────────────────────────────────────────────────────────────
export const TASK_TYPES = [
  "LEAD_FOLLOWUP",
  "CALL_CONTACT",
  "CONFIRM_RESERVATION",
  "OFFER_SUBSCRIPTION",
  "EVENT_PREP",
  "RENEW_SUBSCRIPTION",
  "RECOVER_NO_SHOW",
  "OTHER",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];
export const TASK_TYPE_LABEL: Record<TaskType, string> = {
  LEAD_FOLLOWUP: "Follow-up lead",
  CALL_CONTACT: "Sună contact",
  CONFIRM_RESERVATION: "Confirmă rezervare",
  OFFER_SUBSCRIPTION: "Ofertă abonament",
  EVENT_PREP: "Pregătire eveniment",
  RENEW_SUBSCRIPTION: "Reînnoire abonament",
  RECOVER_NO_SHOW: "Recuperare no-show",
  OTHER: "Altul",
};

// ─── Priority ───────────────────────────────────────────────────────────────
export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: "Înaltă",
  MEDIUM: "Medie",
  LOW: "Joasă",
};

// ─── Task status ────────────────────────────────────────────────────────────
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "De făcut",
  IN_PROGRESS: "În lucru",
  DONE: "Făcut",
};

// ─── Task origin ────────────────────────────────────────────────────────────
export const TASK_ORIGINS = ["MANUAL", "AUTO"] as const;
export type TaskOrigin = (typeof TASK_ORIGINS)[number];

// ─── Event status ───────────────────────────────────────────────────────────
export const EVENT_STATUSES = ["PLANNED", "IN_PROGRESS", "FINISHED", "CANCELLED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];
export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  PLANNED: "Planificat",
  IN_PROGRESS: "În desfășurare",
  FINISHED: "Finalizat",
  CANCELLED: "Anulat",
};

// ─── Slot type ──────────────────────────────────────────────────────────────
export const SLOT_TYPES = ["STANDARD", "BIRTHDAY", "EVENT", "BLOCKED"] as const;
export type SlotType = (typeof SLOT_TYPES)[number];
export const SLOT_TYPE_LABEL: Record<SlotType, string> = {
  STANDARD: "Sesiune standard",
  BIRTHDAY: "Zi de naștere",
  EVENT: "Eveniment",
  BLOCKED: "Blocat",
};

// ─── Pipeline (derived stages) ──────────────────────────────────────────────
export const PIPELINE_STAGES = [
  "LEAD_NEW",
  "CONFIRMED_RESERVATION",
  "FIRST_VISIT",
  "RECURRING_VISITOR",
  "READY_FOR_SUBSCRIPTION",
  "SUBSCRIBED",
  "LOYAL_SUBSCRIBER",
  "NO_SHOW",
  "INACTIVE",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export const PIPELINE_STAGE_LABEL: Record<PipelineStage, string> = {
  LEAD_NEW: "Lead nou",
  CONFIRMED_RESERVATION: "Rezervare confirmată",
  FIRST_VISIT: "Prima vizită",
  RECURRING_VISITOR: "Vizitator recurent",
  READY_FOR_SUBSCRIPTION: "Pregătit pentru abonament",
  SUBSCRIBED: "Abonat",
  LOYAL_SUBSCRIBER: "Abonat fidel",
  NO_SHOW: "No-show",
  INACTIVE: "Inactiv / Pierdut",
};

// ─── Defaults — prețuri, program, targete, scor (din spec sec. 9) ───────────
export const DEFAULT_PRICES = {
  childVisit: 30,
  parentVisit: 60,
  birthday: 1800,
  eventFee: 100,
  subscription8: 350,
  subscription4: 250,
} as const;

export const DEFAULT_SCHEDULE = {
  weekday: [
    { start: "10:00", end: "12:00" },
    { start: "16:00", end: "18:00" },
  ],
  weekend: [{ start: "10:00", end: "12:00" }],
  birthdayDurationHours: 3,
  slotCapacity: 15,
} as const;

export const DEFAULT_TARGETS = {
  survival: 18000,
  breakEven: 30000,
  profitability: 50000,
} as const;

export const DEFAULT_SCORE_RULES = {
  booking: 5,
  confirmed: 10,
  visit: 20,
  secondVisitWithin30d: 10,
  eventAttendance: 15,
  birthdayHeld: 30,
  subscriptionInterest: 10,
  noShow: -15,
  inactivity60d: -10,
  threshold: 60,
} as const;

// ─── Liste seed (din spec sec. 9.4) ─────────────────────────────────────────
export const DEFAULT_LEAD_SOURCES = [
  "Google",
  "Facebook",
  "Instagram",
  "TikTok",
  "Recomandare",
  "Walk-in",
  "Site web",
  "Afiș local",
] as const;

export const DEFAULT_INTERESTS = [
  "Cărți",
  "Evenimente",
  "Joacă liberă",
  "Ateliere creative",
  "Muzică",
  "Mișcare",
] as const;
