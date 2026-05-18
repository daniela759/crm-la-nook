/**
 * Iconițe în stilul Nook — linii subțiri, minimalist, fără mascote.
 * Aliniat cu brandbook-ul: stroke-based, forme moi, simboluri universale.
 */
const props = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const IconDashboard = () => (
  <svg {...props} aria-hidden>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
  </svg>
);

export const IconTasks = () => (
  <svg {...props} aria-hidden>
    <path d="M4 6h16M4 12h10M4 18h7" />
    <circle cx="18" cy="14" r="3.5" />
    <path d="m16.5 14 1 1 2-2.5" />
  </svg>
);

export const IconReservations = () => (
  <svg {...props} aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
    <circle cx="12" cy="14" r="1" />
    <circle cx="8" cy="14" r="1" />
    <circle cx="16" cy="14" r="1" />
  </svg>
);

export const IconCash = () => (
  <svg {...props} aria-hidden>
    <path d="M12 2v20M17 6H9.5a2.5 2.5 0 0 0 0 5h5a2.5 2.5 0 0 1 0 5H7" />
  </svg>
);

export const IconCalendar = () => (
  <svg {...props} aria-hidden>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 11h18M8 3v4M16 3v4" />
  </svg>
);

export const IconFinance = () => (
  <svg {...props} aria-hidden>
    <path d="M3 3v18h18" />
    <path d="M7 14l3-3 3 3 5-5" />
    <path d="M14 9h4v4" />
  </svg>
);

export const IconSettings = () => (
  <svg {...props} aria-hidden>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.4.7.7 1.2.8.2 0 .4.1.6.1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const IconContacts = () => (
  <svg {...props} aria-hidden>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17.5" cy="6.5" r="2.5" />
    <path d="M21 13c0-1.9-1.6-3.5-3.5-3.5" />
  </svg>
);

export const IconSubscription = () => (
  <svg {...props} aria-hidden>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 11h18M7 15h3M14 15h3" />
    <path d="M8 3v4M16 3v4" />
  </svg>
);

export const IconUsers = () => (
  <svg {...props} aria-hidden>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    <circle cx="17" cy="6" r="2.5" />
    <path d="M22 16c0-2.8-2.2-5-5-5" />
    <path d="M14 8.5l1.5 1.5" />
  </svg>
);

export const IconPlus = () => (
  <svg {...props} aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconArrowRight = () => (
  <svg {...props} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconBack = () => (
  <svg {...props} aria-hidden>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);
