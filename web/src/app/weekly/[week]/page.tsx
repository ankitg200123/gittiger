import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, RepoList } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { WEEKLY } from "@/lib/mock-data";
import { isValidIsoWeek, reposForWeek } from "@/lib/discovery";
import { compact } from "@/lib/format";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ week: string }> };

export function generateStaticParams() {
  return WEEKLY.map((digest) => ({ week: digest.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { week } = await params;
  if (!isValidIsoWeek(week)) return { title: "Weekly digest not found" };
  const title = `Week ${week.slice(-2)}, ${week.slice(0, 4)} Digest`;
  return socialMetadata({
    title,
    description: `Weekly trending repository digest for ${week}.`,
    path: `/weekly/${encodeURIComponent(week)}`,
    eyebrow: `WEEKLY DIGEST · ${week}`,
  });
}

export default async function WeeklyDigestPage({ params }: Props) {
  const { week } = await params;
  if (!isValidIsoWeek(week)) notFound();

  const repos = reposForWeek(week, 8).sort(
    (a, b) => b.starsToday - a.starsToday || a.slug.localeCompare(b.slug),
  );
  const leader = repos[0];
  const weekNumber = week.slice(-2);
  const year = week.slice(0, 4);
  const label = WEEKLY.find((digest) => digest.slug === week)?.label ?? `Week ${weekNumber}, ${year}`;

  return (
    <>
      <CollectionJsonLd
        name={`Week ${weekNumber} ${year}`}
        description={`Trending repository digest for ${label}.`}
        path={`/weekly/${encodeURIComponent(week)}`}
        repos={repos}
      />
      <PageShell
        eyebrow={`Weekly digest · ${week}`}
        title={`Week ${weekNumber} ${year}`}
        description={
          leader
            ? `${label}: ${leader.slug} leads this week's seeded sample with +${compact(leader.starsToday)} stars today.`
            : `${label}: no repositories are available in this sample.`
        }
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <span className="label-mono">Deterministic week sample</span>
          <span className="tabular text-[12px] text-muted-foreground">{repos.length} repositories · seed {week}</span>
        </div>
        <RepoList repos={repos} emptyText="No repositories are available for this week." />
      </PageShell>
      <SiteFooter />
    </>
  );
}
