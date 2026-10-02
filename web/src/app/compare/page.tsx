import Link from "next/link";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { RepoComparisonPicker } from "@/components/repo-comparison-picker";
import { COMPARE_PAIRS, compareHref } from "@/lib/discovery";
import { REPOS } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

export const metadata = socialMetadata({
  title: "Compare Repositories",
  description: "Compare GitHub repositories by stars, daily velocity, forks, and star history.",
  path: "/compare",
  eyebrow: "COMPARE GITHUB REPOSITORIES",
});

export default function ComparePage() {
  const title = "Compare Repositories";
  const description = "Compare GitHub repositories by stars, daily velocity, forks, and star history.";
  const repos = COMPARE_PAIRS.flat();
  const uniqueRepos = repos.filter((repo, index) => repos.findIndex((item) => item.slug === repo.slug) === index);

  return (
    <>
      <CollectionJsonLd name={title} description={description} path="/compare" repos={uniqueRepos} />
      <PageShell
        eyebrow="Repository tools · Compare"
        title="Compare repositories"
        description="Put two projects side by side. Review lifetime stars, today's movement, forks, and a shared star-history chart."
      >
        <section aria-labelledby="suggested-comparisons" className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="label-mono">Suggested matchups</p>
              <h2 id="suggested-comparisons" className="mt-2 text-[17px] font-semibold">Start with a comparison</h2>
            </div>
            <GitCompareArrows className="h-5 w-5 text-mosaic-cyan" aria-hidden="true" />
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {COMPARE_PAIRS.map(([a, b]) => (
              <Link
                key={`${a.slug}:${b.slug}`}
                href={compareHref(a, b)}
                className="glass lift group flex min-h-36 flex-col justify-between p-4 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="label-mono">Suggested</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">{a.slug}</p>
                    <p className="tabular mt-1 text-[11px] text-muted-foreground">{compact(a.stars)} stars</p>
                  </div>
                  <span className="label-mono">VS</span>
                  <div className="min-w-0 text-right">
                    <p className="truncate text-[12.5px] font-medium">{b.slug}</p>
                    <p className="tabular mt-1 text-[11px] text-muted-foreground">{compact(b.stars)} stars</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="pick-repositories">
          <div className="mb-4">
            <p className="label-mono">Build your own</p>
            <h2 id="pick-repositories" className="mt-2 text-[17px] font-semibold">Choose two repositories</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Pick one in each column. The same repository cannot be selected twice.</p>
          </div>
          <RepoComparisonPicker repos={REPOS.slice(0, 12)} />
        </section>
        <p className="mt-5 text-[11.5px] text-muted-foreground/75">
          Comparisons use the repository sample bundled with this build; star histories are generated sample series.
        </p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
