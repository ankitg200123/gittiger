/**
 * CSS custom properties in `style` props need a cast or TS rejects them
 * (TS2353). Centralised here so call sites stay clean.
 */
import type { CSSProperties } from "react";

export function cssVars(vars: Record<string, string>): CSSProperties {
  return vars as CSSProperties;
}
