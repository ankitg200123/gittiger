import Link from "next/link";
import { Sparkles, ArrowRight, Flame, Gem, TrendingUp } from "lucide-react";
import { cn } from "cn";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ParticleField } from "@/components/particle-field";
import { RepoRow } from "@/components/repo-row";
import { GlassCard } from "@/components/glass-card";
import { REPOS, TOPICS, LANGUAGES, WEEKLY, MONTHLY, SITE } from "@/lib/mock-data";
import { CollectionJsonLd } from "@/components/json-ld";
import { compact } from "@/lib/format";
import { cssVars } from "@/lib/style";
import { getTrending, getAllRepos } from "@/lib/data-source";

export default function HomePage() {
  // Live pipeline data when available, mock otherwise. The site always renders.
  const { repos: live, date: liveDate } = getTrending(10);
  const top = live.length > 0 ? live : REPOS.slice(0, 10);
  const source = live.length > 0 ? "pipeline" : "mock";
  const rankingDate = liveDate ?? new Date().toISOString().slice(0, 10);
  const today = new Date(rankingDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Repos featured by the content pipeline (have an Instagram/YouTube video).
  const featured = getAllRepos().filter((r) => r.featured).slice(0, 6);

  return (
    <>
      <CollectionJsonLd
        name="Trending GitHub repositories"
        description="AI and developer-tool GitHub repositories ranked daily by star velocity."
        path="/"
        repos={top}
      />
      <SiteNav />

      {/* ── HERO — editorial, left-weighted. Never the centered trio. ── */}
      <section className="relative overflow-hidden border-b border-white/10">
        <ParticleField className="absolute inset-0 h-full w-full opacity-70" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 85% 10%, rgba(34,211,238,0.10), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 mb-6">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mosaic-green opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mosaic-green" />
                </span>
                <span className="label-mono !text-[10px] !tracking-[0.14em]">
                  Ranked {today}
                </span>
              </div>

              <h1 className="font-semibold tracking-tight text-balance text-[40px] leading-[1.05] sm:text-[56px] lg:text-[68px]">
                <span className="aurora-text">Discover what developers</span>
                <br />
                are building right now
              </h1>

              <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-muted-foreground">
                Tracking{" "}
                <span className="tabular text-foreground font-medium">
                  {compact(SITE.totalTracked)}
                </span>{" "}
                GitHub repositories —{" "}
                <span className="tabular text-foreground font-medium">
                  {compact(SITE.activeRanked)}
                </span>{" "}
                actively ranked daily by star velocity.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="#trending"
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-lg px-5 py-2.5",
                    "bg-foreground text-background font-medium text-[14px]",
                    "transition-transform duration-200 hover:scale-[1.02]",
                    "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                  )}
                >
                  See today&apos;s ranking
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/promote"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-[14px] text-muted-foreground transition-colors duration-200 hover:text-foreground hover:border-white/30"
                >
                  <Sparkles className="h-4 w-4" />
                  Promote your project
                </Link>
              </div>
            </div>

            {/* Live stat rail — mono, hard right */}
            <div className="lg:col-span-5 lg:pl-10">
              <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5">
                {[
                  { k: "Repos tracked", v: compact(SITE.totalTracked) },
                  { k: "Ranked today", v: compact(SITE.activeRanked) },
                  { k: "Topics", v: String(TOPICS.length * 4) },
                ].map((s) => (
                  <div key={s.k} className="bg-background/60 p-4 backdrop-blur-md">
                    <div className="label-mono">{s.k}</div>
                    <div className="tabular mt-2 text-[22px] font-semibold">{s.v}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-muted-foreground/70">
                Data from the GitHub public event archive · CC0
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1280px] w-full px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
        {/* ── SPONSOR ROW — board is always populated; house ad when unsold ── */}
        <GlassCard className="mb-12 flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
          <span className="label-mono shrink-0">Sponsored</span>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-mosaic-violet to-mosaic-cyan"
              aria-hidden
            >
              <Sparkles className="h-4 w-4 text-black" />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-medium truncate">
                Built something? Put it in front of millions of developers.
              </p>
              <p className="text-[12px] text-muted-foreground truncate">
                We make a short reel about your project and post it. Send a link, we do the rest.
              </p>
            </div>
          </div>
          <Link
            href="/promote"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-[13px] transition-colors duration-200 hover:border-white/30 hover:text-foreground text-muted-foreground"
          >
            Promote
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </GlassCard>

        <div id="trending" className="grid lg:grid-cols-12 gap-8">
          {/* ── TRENDING LIST — the core surface ── */}
          <div className="lg:col-span-8">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight">
                  Trending Repositories
                </h2>
                <p className="text-[13px] text-muted-foreground mt-1">
                  Ranked by star velocity · {today}
                  {source === "pipeline" ? (
                    <span className="tabular ml-2 text-mosaic-green">● live</span>
                  ) : (
                    <span className="ml-2 text-muted-foreground/60">· sample data</span>
                  )}
                </p>
              </div>
              <Link
                href="/rising"
                className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Flame className="h-3.5 w-3.5" />
                Rising
              </Link>
            </div>

            <GlassCard className="overflow-hidden divide-y divide-white/[0.07]">
              {top.map((repo) => (
                <RepoRow key={repo.slug} repo={repo} />
              ))}
            </GlassCard>
          </div>

          {/* ── BENTO RAIL — intentionally uneven cells ── */}
          <aside className="lg:col-span-4 space-y-6">
            <GlassCard lift className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-mosaic-cyan" />
                <h3 className="text-[14px] font-semibold">Trending Topics</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TOPICS.slice(0, 10).map((t) => (
                  <Link
                    key={t.slug}
                    href={`/trending/${t.slug}`}
                    className="chip transition-transform duration-200 hover:scale-[1.04]"
                    style={cssVars({ "--chip-color": t.accent })}
                  >
                    {t.name}
                    <span className="tabular opacity-60">{compact(t.count)}</span>
                  </Link>
                ))}
              </div>
              <Link
                href="/topics"
                className="mt-4 inline-flex items-center gap-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                All topics <ArrowRight className="h-3 w-3" />
              </Link>
            </GlassCard>

            <GlassCard lift className="p-5">
              <h3 className="text-[14px] font-semibold mb-4">Browse by language</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {LANGUAGES.slice(0, 8).map((l) => (
                  <Link
                    key={l.slug}
                    href={`/languages/${l.slug}`}
                    className="flex items-center justify-between rounded-md border border-white/10 px-2.5 py-1.5 text-[12.5px] transition-colors duration-200 hover:bg-white/[0.04] hover:border-white/20"
                  >
                    <span className="text-foreground/90">{l.name}</span>
                    <span className="tabular text-[11px] text-muted-foreground">
                      {compact(l.count)}
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href="/languages"
                className="mt-4 inline-flex items-center gap-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                All languages <ArrowRight className="h-3 w-3" />
              </Link>
            </GlassCard>

            <GlassCard lift className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Gem className="h-4 w-4 text-mosaic-green" />
                <h3 className="text-[14px] font-semibold">Hidden Gems</h3>
              </div>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                Under 2,000 stars with outsized recent momentum. Ranked daily.
              </p>
              <Link
                href="/hidden-gems"
                className="mt-4 inline-flex items-center gap-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Explore <ArrowRight className="h-3 w-3" />
              </Link>
            </GlassCard>

            <GlassCard lift className="p-5">
              <h3 className="text-[14px] font-semibold mb-4">Digests</h3>
              <div className="space-y-3">
                <div>
                  <span className="label-mono">Weekly</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {WEEKLY.slice(0, 4).map((w) => (
                      <Link
                        key={w.slug}
                        href={w.href}
                        className="tabular rounded-md border border-white/10 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:border-white/25"
                      >
                        {w.label.replace("Week ", "W")}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="label-mono">Monthly</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {MONTHLY.slice(0, 3).map((m) => (
                      <Link
                        key={m.slug}
                        href={m.href}
                        className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground hover:border-white/25"
                      >
                        {m.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </aside>
        </div>

        {/* ── FEATURED — repos with a GitTiger video ── */}
        {featured.length > 0 && (
          <section className="mt-16">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight">Featured</h2>
                <p className="text-[12.5px] text-muted-foreground mt-1">
                  Repos we made a video about — watch on Instagram &amp; YouTube
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((r) => (
                <Link
                  key={r.slug}
                  href={`/repo/${r.owner}/${r.name}`}
                  className="group"
                >
                  <GlassCard lift className="p-5 h-full">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.avatarUrl}
                        alt=""
                        width={32}
                        height={32}
                        loading="lazy"
                        className="h-8 w-8 rounded-lg border border-white/10"
                      />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                        <span className="text-muted-foreground">{r.owner}/</span>
                        {r.name}
                      </span>
                    </div>
                    <p className="mt-3 text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                      {r.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                      {r.language && <span className="label-mono">{r.language}</span>}
                      <span className="tabular">{compact(r.stars)} ★</span>
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
