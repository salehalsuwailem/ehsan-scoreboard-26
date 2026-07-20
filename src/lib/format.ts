const RANK_LABELS = [
  "",
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
];

/** 54.236 -> "54.2%" — one decimal, trailing zero trimmed, never NaN. */
export function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}%`;
}

export function fmtNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);
}

export function rankLabel(rank: number): string {
  return RANK_LABELS[rank] ?? `المركز ${rank}`;
}

export function fmtDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
  }).format(date);
  const time = new Intl.DateTimeFormat("ar", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    numberingSystem: "latn",
  }).format(date);
  return `${day} — ${time}`;
}

export function fmtDateShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "short",
    numberingSystem: "latn",
  }).format(date);
}

/**
 * State label for a completion percentage — mirrors the product spec examples
 * (ممتاز / جيد جداً / جيد / يحتاج تطوير) and maps to the brand state colors.
 */
export function pctState(pct: number): {
  label: string;
  text: string;
  bar: string;
} {
  if (pct >= 85) return { label: "ممتاز", text: "text-success", bar: "bg-success" };
  if (pct >= 65)
    return { label: "جيد جداً", text: "text-secondary", bar: "bg-secondary" };
  if (pct >= 40) return { label: "جيد", text: "text-accent", bar: "bg-accent" };
  return { label: "يحتاج تطوير", text: "text-destructive", bar: "bg-destructive" };
}
