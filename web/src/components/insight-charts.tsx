import { compact } from "@/lib/format";

export type ChartDatum = { label: string; value: number };

export function HorizontalBarChart({
  data,
  color,
  ariaLabel,
}: {
  data: ChartDatum[];
  color: string;
  ariaLabel: string;
}) {
  const width = 720;
  const rowHeight = 38;
  const height = Math.max(rowHeight * data.length + 14, 60);
  const labelWidth = 160;
  const valueWidth = 68;
  const plotWidth = width - labelWidth - valueWidth - 18;
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <svg
      className="h-auto w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
    >
      {data.map((item, index) => {
        const y = index * rowHeight + 8;
        const barWidth = Math.max(2, (item.value / max) * plotWidth);
        return (
          <g key={item.label}>
            <text
              x={0}
              y={y + 17}
              className="fill-slate-300 text-[12px]"
              dominantBaseline="middle"
            >
              {item.label}
            </text>
            <rect
              x={labelWidth}
              y={y + 7}
              width={plotWidth}
              height={12}
              rx={3}
              fill="rgba(255,255,255,0.055)"
            />
            <rect
              x={labelWidth}
              y={y + 7}
              width={barWidth}
              height={12}
              rx={3}
              fill={color}
              fillOpacity={0.82}
            />
            <text
              x={labelWidth + plotWidth + 12}
              y={y + 17}
              textAnchor="start"
              dominantBaseline="middle"
              className="tabular fill-slate-200 text-[11px]"
            >
              {compact(item.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function VelocityHistogram({ values }: { values: number[] }) {
  const width = 720;
  const height = 260;
  const left = 48;
  const right = 16;
  const top = 20;
  const bottom = 54;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(...values, 1);
  const binSize = Math.max(1, Math.ceil(maxValue / (8 * 100)) * 100);
  const bins = Array.from({ length: 8 }, (_, index) => ({
    label: `${index * binSize}–${(index + 1) * binSize - 1}`,
    count: 0,
  }));
  for (const value of values) {
    const index = Math.min(7, Math.floor(value / binSize));
    bins[index].count += 1;
  }
  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
  const slotWidth = plotWidth / bins.length;
  const barWidth = slotWidth * 0.58;

  return (
    <svg
      className="h-auto w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Histogram of repository stars gained today across eight velocity ranges"
    >
      {[0, 0.5, 1].map((fraction) => {
        const y = top + plotHeight * fraction;
        return (
          <g key={fraction}>
            <line
              x1={left}
              x2={width - right}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.10)"
              strokeDasharray={fraction === 1 ? undefined : "3 5"}
            />
            <text
              x={left - 10}
              y={y + 4}
              textAnchor="end"
              className="tabular fill-slate-500 text-[10px]"
            >
              {Math.round(maxCount * (1 - fraction))}
            </text>
          </g>
        );
      })}
      {bins.map((bin, index) => {
        const barHeight = (bin.count / maxCount) * plotHeight;
        const x = left + index * slotWidth + (slotWidth - barWidth) / 2;
        const y = top + plotHeight - barHeight;
        return (
          <g key={bin.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(barHeight, 1)}
              rx={4}
              fill="#7c5cff"
              fillOpacity={0.78}
            />
            <text
              x={x + barWidth / 2}
              y={Math.max(top + 12, y - 7)}
              textAnchor="middle"
              className="tabular fill-slate-200 text-[11px]"
            >
              {bin.count}
            </text>
            <text
              x={left + index * slotWidth + slotWidth / 2}
              y={height - 20}
              textAnchor="middle"
              className="tabular fill-slate-400 text-[10px]"
            >
              {bin.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
