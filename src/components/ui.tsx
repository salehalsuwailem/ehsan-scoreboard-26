import type { HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Card ---------------------------------- */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cn("rounded-card border bg-card text-card-foreground shadow-soft", className)} {...rest}>
      {children}
    </div>
  );
}

/* ---------------------------------- Badge --------------------------------- */

const BADGE_VARIANTS = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary/15 text-secondary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/25 text-[#8a6a00]",
  accent: "bg-accent/20 text-[#9a5310]",
  muted: "bg-muted text-muted-foreground",
} as const;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof BADGE_VARIANTS;
  children: ReactNode;
}

export function Badge({ variant = "muted", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold",
        BADGE_VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Input --------------------------------- */

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-field border border-input bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...rest}
    />
  );
}
