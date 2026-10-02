/**
 * Mosaic accent system.
 *
 * Every topic carries its own hue; all UI chrome stays monochrome. The accent is a
 * data signal, never decoration. See design-system/logic-mosaic-trends/MASTER.md
 *
 * Chart accessibility: hue is NEVER the sole encoder — every series also gets a
 * direct label and a distinct dash style.
 */

export const MOSAIC = {
  violet: "#7c5cff",
  cyan: "#22d3ee",
  green: "#22c55e",
  amber: "#f59e0b",
  rose: "#fb7185",
  blue: "#3b82f6",
} as const;

export type MosaicKey = keyof typeof MOSAIC;

/** Deterministic hue per slug so a topic always lands on the same colour. */
export function mosaicFor(slug: string): (typeof MOSAIC)[MosaicKey] {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const keys = Object.keys(MOSAIC) as MosaicKey[];
  return MOSAIC[keys[h % keys.length]];
}

/** Rank podium colours — gold/silver/bronze, mono beyond #3. */
export function rankColor(rank: number): string {
  if (rank === 1) return MOSAIC.amber;
  if (rank === 2) return "#cbd5e1";
  if (rank === 3) return "#b45309";
  return "rgba(255,255,255,0.10)";
}

/** Contrast-safe text colour for a mosaic hue on #020617. */
export function mosaicText(hex: string): string {
  return `color-mix(in oklab, ${hex} 88%, white)`;
}
