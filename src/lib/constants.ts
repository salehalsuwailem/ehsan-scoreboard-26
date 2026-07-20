export const SITE_NAME = "درع إحسان 2026";
export const APP_VERSION = "1.0.0";

/** ألوان السلاسل في المخططات متعددة المجموعات — مشتقة من هوية إحسان. */
export const GROUP_CHART_COLORS = [
  "#0F3D6E",
  "#2D9CDB",
  "#F2994A",
  "#27AE60",
  "#F2C94C",
  "#7DB8E8",
  "#186F65",
  "#64748B",
] as const;

export const BRAND = {
  primary: "#0F3D6E",
  secondary: "#2D9CDB",
  accent: "#F2994A",
  success: "#27AE60",
  warning: "#F2C94C",
  danger: "#EB5757",
  border: "#E5E7EB",
  muted: "#6B7280",
} as const;

export const MEDAL_STYLES: Record<
  number,
  { row: string; chip: string; label: string; emoji: string }
> = {
  1: {
    row: "bg-warning/10 hover:bg-warning/15",
    chip: "bg-warning/20 text-[#8a6a00]",
    label: "الأول",
    emoji: "🥇",
  },
  2: {
    row: "bg-slate-100/80 hover:bg-slate-100",
    chip: "bg-slate-200 text-slate-600",
    label: "الثاني",
    emoji: "🥈",
  },
  3: {
    row: "bg-accent/10 hover:bg-accent/15",
    chip: "bg-accent/20 text-[#9a5310]",
    label: "الثالث",
    emoji: "🥉",
  },
};
