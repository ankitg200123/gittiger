/**
 * Sparkline — SVG, no library. Direct label + hard baseline per the chart rules.
 * Hue is never the sole encoder; the value is always printed as text alongside.
 */
import { compact } from "@/lib/format";

type Props = {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  className?: string;
  showArea?: boolean;
  "aria-label"?: string;
};

export function Sparkline({
  data,
  color = "#7c5cff",
  width = 96,
  height = 28,
  className,
  showArea = true,
  "aria-label": ariaLabel,
}: Props) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pad = 2;
  const usable = height - pad * 2;

  const pts = data.map((v, i) => {
    const x = i * step;
    const y = pad + usable - ((v - min) / span) * usable;
    return [x, y] as const;
  });

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const gid = `spark-${color.replace("#", "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {showArea && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

/** Value printed as text next to the line — hue is never the only signal. */
export function SparklineLabeled({
  data,
  color,
  label,
}: {
  data: number[];
  color?: string;
  label?: string;
}) {
  const last = data[data.length - 1] ?? 0;
  return (
    <div className="flex items-center gap-2">
      <Sparkline data={data} color={color} aria-label={label ?? "star history"} />
      <span className="tabular text-xs text-muted-foreground">{compact(last)}</span>
    </div>
  );
}
