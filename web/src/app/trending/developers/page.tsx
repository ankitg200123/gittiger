import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { DEVELOPERS } from "@/lib/discovery";
import { compact } from "@/lib/format";
import { socialMetadata } from "@/lib/seo";

export const metadata = socialMetadata({
  title: "Trending Developers",
  description: "Repository owners ranked by the total stars gained across their sample repositories.",
  path: "/trending/developers",
  eyebrow: "DEVELOPERS GAINING GROUND",
});

export default function TrendingDevelopersPage() {
  return (
    <>
      <PageShell
        eyebrow="People · Trending developers"
        title="Developers gaining ground"
        description="Repository owners ranked by stars gained today across their repositories in the current sample."
      >
        <div className="glass overflow-hidden divide-y divide-white/[0.07]">
          {DEVELOPERS.map((developer, index) => {
            const avatar = developer.repos[0]?.avatarUrl;
            return (
              <Link
                key={developer.owner}
                href={`/user/${encodeURIComponent(developer.owner)}`}
                className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-white/[0.035] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px] sm:px-5"
              >
                <span className={`rank shrink-0 ${index < 3 ? "rank-top" : ""}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {avatar ? (
                  <Image
                    src={avatar}
                    alt=""
                    width={44}
                    height={44}
                    loading="lazy"
                    unoptimized
                    className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/5"
                  />
                ) : (
                  <span className="h-11 w-11 shrink-0 rounded-xl border border-white/10 bg-white/5" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold group-hover:text-white">{developer.owner}</span>
                  <span className="mt-1 block text-[12px] text-muted-foreground">
                    {developer.repos.length} {developer.repos.length === 1 ? "repository" : "repositories"}
                  </span>
                </span>
                <span className="tabular shrink-0 text-right">
                  <span className="block text-[13px] font-semibold text-mosaic-green">+{compact(developer.starsGained)}</span>
                  <span className="mt-1 block text-[10.5px] text-muted-foreground">stars today</span>
                </span>
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-mosaic-cyan sm:block" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
        <p className="mt-5 text-[11.5px] text-muted-foreground/75">
          Totals aggregate starsToday for each owner in the bundled repository sample.
        </p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
