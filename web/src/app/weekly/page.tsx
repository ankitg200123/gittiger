import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { WEEKLY } from "@/lib/mock-data";
import { CollectionJsonLd } from "@/components/json-ld";
import { reposForWeek } from "@/lib/discovery";
import { compact } from "@/lib/format";
import { socialMetadata } from "@/lib/seo";

export const metadata = socialMetadata({
  title: "Weekly Digests",
  description: "Browse weekly snapshots of the repositories gaining attention.",
  path: "/weekly",
  eyebrow: "WEEKLY REPOSITORY ARCHIVE",
});

export default function WeeklyPage() {
  return (
    <>
      <CollectionJsonLd
        name="Weekly Repositories"
        description="Weekly snapshots of the repositories gaining attention."
        path="/weekly"
        repos={WEEKLY.flatMap((week) => reposForWeek(week.slug, 8)).filter(
          (repo, index, all) => all.findIndex((item) => item.slug === repo.slug) === index,
        )}
      />
      <PageShell
        eyebrow="Archive · Weekly"
        title="Weekly digests"
        description="Open a week to see a repeatable, week-seeded slice of the repository sample."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {WEEKLY.map((week, index) => {
            const repos = reposForWeek(week.slug, 8).sort(
              (a, b) => b.starsToday - a.starsToday || a.slug.localeCompare(b.slug),
            );
            const leader = repos[0];
            return (
              <Link
                key={week.slug}
                href={week.href}
                className="glass lift group flex min-h-52 flex-col p-5 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="label-mono">{String(index + 1).padStart(2, "0")} / archive</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <h2 className="mt-5 text-[19px] font-semibold tracking-tight group-hover:text-white">{week.label}</h2>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                  {leader ? `${leader.slug} leads the seeded sample with +${compact(leader.starsToday)} stars today.` : "Open this weekly snapshot."}
                </p>
                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-[11.5px] text-muted-foreground">
                  <span className="tabular">{repos.length} repositories</span>
                  <span>View digest</span>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-5 text-[11.5px] text-muted-foreground/75">
          Weekly cards use deterministic sample selections; they are not historical GitHub snapshots.
        </p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
