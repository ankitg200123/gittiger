"use client";

/**
 * Glass card — the canonical surface. Liquid Glass Terminal: soft atmosphere,
 * hard data. The ::before reflection edge lives in globals.css.
 */
import { cn } from "cn";
export function GlassCard({
  className,
  strong,
  lift,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean; lift?: boolean }) {
  return (
    <div
      className={cn(
        "glass",
        strong && "glass-strong",
        lift && "lift",
        className,
      )}
      {...props}
    />
  );
}
