/** دمج أصناف Tailwind بشكل شرطي — بديل خفيف بدون مكتبات. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
