import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Star, GitFork, ExternalLink, ArrowLeft, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { cn } from "cn";
import { SiteNav } from "@/components/site-nav";
import { GlassCard } from "@/components/glass-card";
import { Sparkline } from "@/components/sparkline";
import { getRepo, getAllRepos } from "@/lib/data-source";
import { REPOS, starHistory, SITE } from "@/lib/mock-data";
import { compact, full, relativeTime } from "@/lib/format";
import { cssVars } from "@/lib/style";
import { JsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

export const dynamicParams = true;

type Params = { owner: string; name: string };

export function generateStaticParams() {
  return getAllRepos().map((r) => ({ owner: r.owner, name: r.name }));
}

function findRepo(owner: string, name: string) {
  return getRepo(owner, name);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { owner, name } = await params;
  const repo = findRepo(owner, name);
  if (!repo) return { title: "Repository not found" };
  return socialMetadata({
    title: `${repo.owner}/${repo.name}`,
    description: repo.description,
    path: `/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`,
    eyebrow: `GITHUB REPOSITORY · #${repo.rank} TRENDING`,
  });
}

const FAQ = [
  { q: "What is this project?", a: "An open-source project with an active community and steady growth." },
  { q: "Who is it for?", a: "Developers building AI tools and workflows who need a reliable foundation." },
  { q: "Is it free?", a: "Yes — the source is available on GitHub under an open-source licence." },
  { q: "How is it trending?", a: "Ranked by star velocity, not raw star count, so new momentum surfaces." },
];

export default async function RepoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { owner, name } = await params;
  const repo = findRepo(owner, name);
  if (!repo) notFound();

  const hist = starHistory(repo.slug, 90);
  const max = Math.max(...hist);
  const min = Math.min(...hist);
  const range = max - min || 1;
  const W = 1000;
  const H = 260;

  const pts = hist.map((v, i) => {
    const x = (i / (hist.length - 1)) * W;
    const y = H - 24 - ((v - min) / range) * (H - 48);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  const similar = getAllRepos()
    .filter((r) => r.slug.toLowerCase() !== repo.slug.toLowerCase())
    .slice(0, 5);
  const accent = repo.accent;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": `${new URL(`/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`, "https://gittiger.com").toString()}#software`,
    name: repo.name,
    alternateName: repo.slug,
    url: new URL(`/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`, "https://gittiger.com").toString(),
    description: repo.description,
    codeRepository: `https://github.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`,
    author: { "@type": "Organization", name: repo.owner },
    ...(repo.language ? { programmingLanguage: repo.language } : {}),
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/StarAction", userInteractionCount: repo.stars },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/ForkAction", userInteractionCount: repo.forks },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <SiteNav />

      <main className="mx-auto max-w-[1280px] w-full px-4 sm:px-6 lg:px-10 py-10 lg:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to trending
        </Link>

        {/* ── HEADER ── */}
        <GlassCard className="p-6 lg:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <img
              src={repo.avatarUrl}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-xl border border-white/10 bg-white/5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <nav className="label-mono mb-2 flex items-center gap-1.5" aria-label="Breadcrumb">
                <Link href={`/user/${repo.owner}`} className="hover:text-foreground transition-colors">
                  {repo.owner}
                </Link>
                <span>/</span>
                <span className="text-foreground/70">{repo.name}</span>
              </nav>
              <h1 className="text-[28px] lg:text-[34px] font-semibold tracking-tight">
                {repo.name}
              </h1>
              <p className="mt-2.5 text-[14.5px] text-muted-foreground leading-relaxed max-w-2xl">
                {repo.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {repo.topics.map((t) => (
                  <span key={t} className="chip" style={cssVars({ "--chip-color": accent })}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <a
              href={`https://github.com/${repo.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "shrink-0 inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5",
                "text-[13.5px] transition-colors duration-200 hover:border-white/30 hover:text-foreground text-muted-foreground",
              )}
            >
              View on GitHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Stat strip — every number mono */}
          <div className="mt-7 pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { k: "Stars", v: full(repo.stars), c: "text-mosaic-amber", i: Star },
              { k: "Forks", v: full(repo.forks), c: "text-foreground", i: GitFork },
              { k: "+ today", v: `+${compact(repo.starsToday)}`, c: "text-mosaic-green", i: null },
              { k: "Created", v: relativeTime(repo.createdAt), c: "text-foreground", i: null },
            ].map((s) => (
              <div key={s.k}>
                <div className="label-mono">{s.k}</div>
                <div className={cn("tabular mt-1.5 text-[20px] font-semibold", s.c)}>
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* ── STAR HISTORY — direct labels, never hue-only ── */}
            <section>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-semibold">Star History</h2>
                  <p className="text-[12.5px] text-muted-foreground mt-1">Last 90 days</p>
                </div>
                <span className="tabular text-[13px]" style={{ color: accent }}>
                  {full(repo.stars)} stars
                </span>
              </div>
              <GlassCard className="p-5">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Star history over the last 90 days">
                  <defs>
                    <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={accent} stopOpacity={0.26} />
                      <stop offset="100%" stopColor={accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {/* hard baseline — the papercut against the glass */}
                  <line x1="0" y1={H - 24} x2={W} y2={H - 24} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <path d={area} fill="url(#area-fill)" />
                  <path d={line} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
                  <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill={accent} />
                </svg>
                <div className="mt-3 flex items-center justify-between">
                  <span className="label-mono">{full(min)}</span>
                  <span className="label-mono">→</span>
                  <span className="label-mono">{full(max)}</span>
                </div>
              </GlassCard>
            </section>

            {/* ── AI WRITE-UP — placeholder until the enrichment pipeline lands ── */}
            <section>
              <h2 className="text-[18px] font-semibold mb-4">Overview</h2>
              <GlassCard className="p-6 lg:p-7 space-y-5">
                <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>Summary generated from the repository README</span>
                </div>
                <div className="space-y-4 text-[14.5px] leading-relaxed text-foreground/90">
                  <p>
                    {repo.description} It ranks #{repo.rank} on GitTiger today,
                    gaining{" "}
                    <span className="tabular text-mosaic-green">+{compact(repo.starsToday)}</span>{" "}
                    stars in the last 24 hours.
                  </p>
                  <p>
                    The project is written in{" "}
                    <span className="text-foreground font-medium">{repo.language}</span> and has
                    accumulated <span className="tabular">{full(repo.forks)}</span> forks across
                    its lifetime. It was created{" "}
                    <span className="tabular">{relativeTime(repo.createdAt)}</span> ago.
                  </p>
                  <p className="text-muted-foreground">
                    The full enrichment write-up — key features, installation, how it works,
                    use cases, strengths, limitations, and alternatives — is generated by the
                    ingest pipeline and appears here automatically.
                  </p>
                </div>

                <div className="codecut p-4">
                  <div className="label-mono mb-2">Installation</div>
                  <pre className="text-[12.5px] leading-relaxed text-mosaic-cyan overflow-x-auto">
                    <code>git clone https://github.com/{repo.slug}.git{"\n"}cd {repo.name}{"\n"}# see README for setup</code>
                  </pre>
                </div>
              </GlassCard>
            </section>

            {/* ── FAQ — schema bait for rich results ── */}
            <section>
              <h2 className="text-[18px] font-semibold mb-4">Frequently Asked Questions</h2>
              <GlassCard className="divide-y divide-white/[0.07]">
                {FAQ.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer items-center justify-between text-[14px] font-medium list-none">
                      {f.q}
                      <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-2.5 text-[13.5px] text-muted-foreground leading-relaxed">
                      {f.a}
                    </p>
                  </details>
                ))}
              </GlassCard>
            </section>
          </div>

          {/* ── SIDEBAR — the sponsor placement lives here ── */}
          <aside className="lg:col-span-4 space-y-6">
            <GlassCard className="p-5">
              <span className="label-mono">Details</span>
              <dl className="mt-4 space-y-3 text-[13px]">
                {[
                  ["Global rank", `#${repo.rank}`],
                  ["Language", repo.language ?? "—"],
                  ["Score", repo.score.toFixed(1)],
                  ["License", "Open source"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="tabular text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            </GlassCard>

            {/* Sponsored sidebar slot — house ad when unsold */}
            <GlassCard strong className="p-5">
              <span className="label-mono">Sponsored</span>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-mosaic-violet to-mosaic-cyan">
                  <Sparkles className="h-4 w-4 text-black" />
                </span>
                <div>
                  <p className="text-[13px] font-medium">Reach developers here</p>
                  <p className="text-[12px] text-muted-foreground">Your product in this sidebar</p>
                </div>
              </div>
              <Link
                href="/advertise"
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/15 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground hover:border-white/30"
              >
                Advertise
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </GlassCard>

            <GlassCard className="p-5">
              <span className="label-mono">Similar Repositories</span>
              <div className="mt-4 space-y-1">
                {similar.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/repo/${s.owner}/${s.name}`}
                    className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors duration-200 hover:bg-white/[0.04]"
                  >
                    <img
                      src={s.avatarUrl}
                      alt=""
                      width={28}
                      height={28}
                      loading="lazy"
                      className="h-7 w-7 rounded-md border border-white/10"
                    />
                    <span className="min-w-0 flex-1 truncate text-[12.5px]">
                      <span className="text-muted-foreground">{s.owner}/</span>
                      <span className="font-medium">{s.name}</span>
                    </span>
                    <Sparkline data={starHistory(s.slug, 10)} color={s.accent} width={44} height={18} />
                    <span className="tabular text-[11px] text-muted-foreground w-[42px] text-right">
                      {compact(s.stars)}
                    </span>
                  </Link>
                ))}
              </div>
            </GlassCard>
          </aside>
        </div>
      </main>
    </>
  );
}
