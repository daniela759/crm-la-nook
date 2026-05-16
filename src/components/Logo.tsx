type LogoProps = {
  /** Mărime — controlează font-size-ul textului */
  size?: "sm" | "md" | "lg" | "xl";
  /** Afișează tagline-ul „Growing through play" sub logo */
  tagline?: boolean;
  /** Culoare principală (text + ramuri). Default: forest. */
  tone?: "forest" | "terracotta" | "paper";
};

const SIZES = {
  sm: { text: "text-2xl", branch: 22 },
  md: { text: "text-4xl", branch: 36 },
  lg: { text: "text-6xl", branch: 52 },
  xl: { text: "text-8xl", branch: 70 },
} as const;

const TONES = {
  forest: "text-nook-forest",
  terracotta: "text-nook-terracotta",
  paper: "text-nook-paper",
} as const;

export function Logo({ size = "md", tagline = false, tone = "forest" }: LogoProps) {
  const { text, branch } = SIZES[size];

  return (
    <div className="inline-flex flex-col items-start">
      <div className={`inline-flex items-end gap-1 ${TONES[tone]}`}>
        <span
          className={`${text} font-display font-extrabold leading-none tracking-tight lowercase`}
        >
          nook
        </span>
        <BranchMark size={branch} />
      </div>
      {tagline && (
        <span
          className={`mt-1 text-xs sm:text-sm font-sans tracking-wide ${TONES[tone]} opacity-80`}
        >
          Growing through play
        </span>
      )}
    </div>
  );
}

function BranchMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      className="-mb-1"
    >
      {/* Tulpină */}
      <path
        d="M20 38 C 20 28, 19 18, 20 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Frunze stânga */}
      <ellipse cx="13" cy="14" rx="5.5" ry="3" fill="currentColor" transform="rotate(-35 13 14)" />
      <ellipse cx="11" cy="22" rx="4.5" ry="2.5" fill="currentColor" transform="rotate(-25 11 22)" />
      {/* Frunze dreapta */}
      <ellipse cx="27" cy="14" rx="5.5" ry="3" fill="currentColor" transform="rotate(35 27 14)" />
      <ellipse cx="29" cy="22" rx="4.5" ry="2.5" fill="currentColor" transform="rotate(25 29 22)" />
      {/* Mugurele de sus */}
      <ellipse cx="20" cy="6" rx="3.5" ry="2.5" fill="currentColor" />
    </svg>
  );
}
