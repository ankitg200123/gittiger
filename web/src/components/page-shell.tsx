/**
 * Shared page shell — consistent header/nav/footer for listing pages.
 * Extracted so every index page has identical rhythm without duplicating markup.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "cn";
import { SiteNav } from "@/components/site-nav";
import { GlassCard } from "@/components/glass-card";
import { RepoRow } from "@/components/repo-row";
import { cssVars } from "@/lib/style";
import type { Repo } from "@/lib/types";

export function PageShell({
  eyebrow,
  title,
  description,
  accent,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  /** Optional topic accent hue for the eyebrow + title edge. */
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-[1280px] w-full px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
        <header className="mb-10 max-w-2xl">
          <span
            className="label-mono"
            style={accent ? cssVars({ "--accent": accent }) : undefined}
            {...(accent ? { "data-accent": "" } : {})}
          >
            {eyebrow}
          </span>
          <h1
            className="mt-3 text-[30px] lg:text-[38px] font-semibold tracking-tight text-balance"
            style={accent ? cssVars({ "--accent": accent }) : undefined}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-3.5 text-[14.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </header>
        {children}
      </main>
    </>
  );
}

/** Small inline note for fallback messaging on filtered pages. */
export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 text-[12.5px] text-muted-foreground/80 border border-white/10 rounded-lg bg-white/[0.02] px-4 py-3">
      {children}
    </p>
  );
}

export function RepoList({ repos, emptyText }: { repos: Repo[]; emptyText?: string }) {
  if (repos.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-[13.5px] text-muted-foreground">
          {emptyText ?? "No repositories match this filter yet."}
        </p>
      </GlassCard>
    );
  }
  return (
    <GlassCard className="overflow-hidden divide-y divide-white/[0.07]">
      {repos.map((repo) => (
        <RepoRow key={repo.slug} repo={repo} />
      ))}
    </GlassCard>
  );
}

export function IndexGrid({
  items,
}: {
  items: { slug: string; name: string; count: number; accent?: string; href: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <Link
          key={t.slug}
          href={t.href}
          className={cn(
            "group glass lift p-4 flex items-center justify-between gap-4",
            "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {t.accent && (
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: t.accent }}
                  aria-hidden
                />
              )}
              <span className="text-[14px] font-medium truncate group-hover:text-white transition-colors">
                {t.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="tabular text-[12px] text-muted-foreground">
              {Intl.NumberFormat("en-US", { notation: "compact" }).format(t.count)}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
