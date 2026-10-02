/**
 * Numeric formatters. Every number in the product renders in JetBrains Mono via the
 * `.tabular` class — the strongest single "a designer made this" signal on a data site.
 */

export function compact(n: number): string {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function full(n: number): string {
  return Intl.NumberFormat("en-US").format(n);
}

export function signed(n: number): string {
  return n > 0 ? `+${compact(n)}` : compact(n);
}

/** "3.3k today" style velocity, always explicit about the window. */
export function velocity(n: number, window = "today"): string {
  return `${signed(n)} ${window}`;
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  const hrs = Math.round(diff / 3_600_000);
  const days = Math.round(diff / 86_400_000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}
