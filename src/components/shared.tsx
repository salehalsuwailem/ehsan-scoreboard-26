import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MEDAL_STYLES } from "@/lib/constants";
import { fmtDateTime, pctState } from "@/lib/format";
import { ar } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { IconArrowDown, IconArrowUp, IconClock, IconInbox, IconMinus } from "@/components/Icons";

/* ------------------------------ SectionTitle ------------------------------ */

export function SectionTitle({ title, subtitle, id }: { title: string; subtitle?: string; id?: string }) {
  return (
    <div className="mb-6 space-y-1">
      <h2 id={id} className="text-section text-primary">
        {title}
      </h2>
      {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

/* ------------------------------- EmptyState ------------------------------- */

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed bg-muted/40 px-6 py-12 text-center">
      <span className="text-muted-foreground/70">{icon ?? <IconInbox className="h-8 w-8" />}</span>
      <p className="font-semibold text-foreground">{title}</p>
      {hint ? <p className="text-caption text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ------------------------------- MedalBadge ------------------------------- */

/** شارة ذهب/فضة/برونز للمراكز 1–3، ورقم عادي لما بعدها. */
export function MedalBadge({ rank, className }: { rank: number; className?: string }) {
  const medal = MEDAL_STYLES[rank];

  if (!medal) {
    return (
      <span
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground tabular",
          className
        )}
      >
        {rank}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full px-2 text-sm font-bold",
        medal.chip,
        className
      )}
      title={medal.label}
    >
      <span aria-hidden>{medal.emoji}</span>
      <span className="tabular">{rank}</span>
    </span>
  );
}

/* ------------------------------ MovementBadge ----------------------------- */

/** ⬆ صعود / ⬇ هبوط / ➖ ثابت — مقارنةً بلقطة المزامنة السابقة. */
export function MovementBadge({ movement, className }: { movement: number | null; className?: string }) {
  if (movement === null) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-muted-foreground", className)}>
        <IconMinus className="h-4 w-4" />
      </span>
    );
  }

  if (movement > 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 font-semibold text-success", className)} title="صعود">
        <IconArrowUp className="h-4 w-4" />
        <span className="tabular">{movement}</span>
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 font-semibold text-destructive", className)}
        title="هبوط"
      >
        <IconArrowDown className="h-4 w-4" />
        <span className="tabular">{Math.abs(movement)}</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-muted-foreground", className)} title="ثابت">
      <IconMinus className="h-4 w-4" />
    </span>
  );
}

/* ------------------------------- LastUpdated ------------------------------ */

export function LastUpdated({ iso }: { iso: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
      <IconClock className="h-3.5 w-3.5" />
      {ar.hero.lastUpdate}: {fmtDateTime(iso)}
    </span>
  );
}

/* ------------------------------ AnimatedNumber ---------------------------- */

/** يعدّ من صفر إلى القيمة مرة واحدة عند الظهور — يحترم تفضيل تقليل الحركة. */
export function AnimatedNumber({
  value,
  decimals = 1,
  suffix = "",
  duration = 900,
  className,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const text = decimals > 0 ? display.toFixed(decimals) : String(Math.round(display));

  return (
    <span className={className}>
      <span className="tabular">{text}</span>
      {suffix}
    </span>
  );
}

/* ------------------------------- ProgressBar ------------------------------ */

export function ProgressBar({ pct, className, label }: { pct: number; className?: string; label?: string }) {
  const [width, setWidth] = useState(0);
  const clamped = Math.max(0, Math.min(100, pct));
  const state = pctState(pct);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(clamped));
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", state.bar)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* ---------------------------------- Wave ---------------------------------- */

/** موجة زخرفية تحاكي انسيابية شعار إحسان. */
export function Wave({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("block h-10 w-full sm:h-14", flip && "rotate-180", className)}
    >
      <path
        d="M0,64 C240,96 480,16 720,32 C960,48 1200,88 1440,48 L1440,90 L0,90 Z"
        className="fill-primary/[0.05]"
      />
      <path
        d="M0,74 C260,100 520,30 760,44 C1000,58 1220,92 1440,60 L1440,90 L0,90 Z"
        className="fill-secondary/10"
      />
    </svg>
  );
}
