import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { COMPARE_PAIRS } from "@/lib/discovery";
import { REPOS, starHistory } from "@/lib/mock-data";
import { compact, full } from "@/lib/format";
import type { Repo } from "@/lib/types";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ a: string; b: string; c: string; d: string }>;
};

type CompareStat = { label: string; valueA: number; valueB: number; format: (value: number) => string };

function getComparisonRepo(owner: string, name: string): Repo | undefined {
  return REPOS.find((repo) => repo.owner === owner && repo.name === name);
}

export function generateStaticParams() {
  return COMPARE_PAIRS.map(([repoA, repoB]) => ({
    a: repoA.owner,
    b: repoA.name,
    c: repoB.owner,
    d: repoB.name,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { a, b, c, d } = await params;
  const repoA = getComparisonRepo(a, b);
  const repoB = getComparisonRepo(c, d);
  if (!repoA || !repoB || repoA.slug === repoB.slug) return { title: "Comparison not found" };
  const title = `${repoA.slug} vs ${repoB.slug}`;
  const description = `Compare ${repoA.slug} and ${repoB.slug} by stars, daily velocity, forks, and sample star history.`;
  return socialMetadata({
    title,
    description,
    path: `/compare/${encodeURIComponent(repoA.owner)}/${encodeURIComponent(repoA.name)}/vs/${encodeURIComponent(repoB.owner)}/${encodeURIComponent(repoB.name)}`,
    eyebrow: "REPOSITORY COMPARISON",
  });
}

export default async function ComparisonPage({ params }: Props) {
  const { a, b, c, d } = await params;
  const repoA = getComparisonRepo(a, b);
  const repoB = getComparisonRepo(c, d);
  if (!repoA || !repoB || repoA.slug === repoB.slug) notFound();

  const historyA = starHistory(repoA.slug, 30);
  const historyB = starHistory(repoB.slug, 30);
  const combined = [...historyA, ...historyB];
  const minHistory = Math.min(...combined);
  const maxHistory = Math.max(...combined);
  const span = maxHistory - minHistory || 1;
  const historyLine = (values: number[]) =>
    values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 760;
        const y = 12 + ((maxHistory - value) / span) * 190;
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  const stats: CompareStat[] = [
    { label: "Total stars", valueA: repoA.stars, valueB: repoB.stars, format: full },
    { label: "Stars gained today", valueA: repoA.starsToday, valueB: repoB.starsToday, format: compact },
    { label: "Forks", valueA: repoA.forks, valueB: repoB.forks, format: full },
  ];

  return (
    <>
      <CollectionJsonLd
        name={`${repoA.slug} vs ${repoB.slug}`}
        description={`Compare ${repoA.slug} and ${repoB.slug} by stars, forks, and star history.`}
        path={`/compare/${encodeURIComponent(repoA.owner)}/${encodeURIComponent(repoA.name)}/vs/${encodeURIComponent(repoB.owner)}/${encodeURIComponent(repoB.name)}`}
        repos={[repoA, repoB]}
      />
      <PageShell
        eyebrow="Repository comparison · Sample history"
        title="Side by side"
        description={`${repoA.slug} compared with ${repoB.slug}. Shared star history is drawn on the same scale.`}
      >
        <section className="glass p-4 sm:p-6" aria-labelledby="history-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-mono">30-day sample series</p>
              <h2 id="history-title" className="mt-2 text-[17px] font-semibold">Star history</h2>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px]">
              <span className="inline-flex items-center gap-2">
                <svg width="28" height="8" aria-hidden="true"><line x1="0" x2="28" y1="4" y2="4" stroke="#22d3ee" strokeWidth="2" /></svg>
                <span>{repoA.slug}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <svg width="28" height="8" aria-hidden="true"><line x1="0" x2="28" y1="4" y2="4" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 3" /></svg>
                <span>{repoB.slug}</span>
              </span>
            </div>
          </div>
          <svg
            className="h-auto w-full overflow-visible"
            viewBox="0 0 760 220"
            role="img"
            aria-label={`Thirty-day star history: ${repoA.slug} is a solid line and ${repoB.slug} is a dashed line`}
          >
            {[0, 0.5, 1].map((fraction) => {
              const y = 12 + fraction * 190;
              const value = Math.round(maxHistory - fraction * span);
              return (
                <g key={fraction}>
                  <line x1="0" x2="760" y1={y} y2={y} stroke="rgba(255,255,255,0.10)" strokeDasharray="3 5" />
                  <text x="4" y={y - 5} className="tabular fill-slate-500 text-[10px]">{compact(value)}</text>
                </g>
              );
            })}
            <path d={historyLine(historyA)} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" />
            <path d={historyLine(historyB)} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8 6" strokeLinejoin="round" />
            <text x="0" y="218" className="tabular fill-slate-400 text-[10px]">30 days ago</text>
            <text x="760" y="218" textAnchor="end" className="tabular fill-slate-400 text-[10px]">Now</text>
          </svg>
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-muted-foreground">
            <span className="tabular">{repoA.slug}: {compact(historyA[0])} → {compact(historyA[historyA.length - 1])}</span>
            <span className="tabular">{repoB.slug}: {compact(historyB[0])} → {compact(historyB[historyB.length - 1])}</span>
          </div>
        </section>

        <section className="mt-5" aria-labelledby="stats-title">
          <div className="mb-3">
            <p className="label-mono">Direct comparison</p>
            <h2 id="stats-title" className="mt-2 text-[17px] font-semibold">Repository stats</h2>
          </div>
          <div className="glass overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(90px,0.75fr)_minmax(90px,0.75fr)] border-b border-white/10 bg-white/[0.025] px-4 py-3 text-[12px] sm:px-5">
              <span className="label-mono">Metric</span>
              <span className="truncate text-right font-medium">{repoA.slug}</span>
              <span className="truncate text-right font-medium">{repoB.slug}</span>
            </div>
            {stats.map((stat) => {
              const winnerA = stat.valueA > stat.valueB;
              const winnerB = stat.valueB > stat.valueA;
              return (
                <div key={stat.label} className="grid grid-cols-[minmax(0,1fr)_minmax(90px,0.75fr)_minmax(90px,0.75fr)] items-center border-b border-white/[0.07] px-4 py-4 last:border-b-0 sm:px-5">
                  <span className="text-[12.5px] text-muted-foreground">{stat.label}</span>
                  <span className={`tabular text-right text-[13px] ${winnerA ? "font-semibold text-mosaic-green" : "text-foreground/85"}`}>
                    {stat.format(stat.valueA)}{winnerA && <span className="sr-only">, higher</span>}
                  </span>
                  <span className={`tabular text-right text-[13px] ${winnerB ? "font-semibold text-mosaic-green" : "text-foreground/85"}`}>
                    {stat.format(stat.valueB)}{winnerB && <span className="sr-only">, higher</span>}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Green values mark the higher figure in that row; equal values remain neutral.</p>
        </section>

        <aside className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <p className="label-mono">About this comparison</p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Star and fork totals come from the bundled repository sample. The shared chart shows deterministic generated 30-day histories, not historical GitHub snapshots. Line labels and dash pattern distinguish both series without relying on hue alone.
          </p>
        </aside>
      </PageShell>
      <SiteFooter />
    </>
  );
}
