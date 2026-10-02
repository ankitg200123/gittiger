import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, RepoList } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { REPOS, TOPICS } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return TOPICS.map((topic) => ({ topic: topic.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const match = TOPICS.find((candidate) => candidate.slug === topic);
  if (!match) return { title: "Topic not found" };
  const title = `Best ${match.name} Repositories`;
  const description = `Explore ${match.name} repositories ranked by all-time stars.`;
  return socialMetadata({
    title,
    description,
    path: `/best/${encodeURIComponent(topic)}`,
    eyebrow: `BEST REPOSITORIES · ${match.name}`,
  });
}

export default async function BestTopicPage({ params }: Props) {
  const { topic } = await params;
  const match = TOPICS.find((candidate) => candidate.slug === topic);
  if (!match) notFound();
  const repos = REPOS.filter((repo) => repo.topics.includes(topic)).sort(
    (a, b) => b.stars - a.stars || a.slug.localeCompare(b.slug),
  );
  const title = `Best ${match.name} Repositories`;
  const description = `Explore ${match.name} repositories ranked by all-time stars.`;
  const path = `/best/${encodeURIComponent(topic)}`;

  return (
    <>
      <CollectionJsonLd name={title} description={description} path={path} repos={repos} />
      <PageShell
        eyebrow={`Best by topic · ${compact(match.count)} indexed`}
        title={`Best ${match.name} repositories`}
        description="Matching sample repositories ranked by all-time stars. Daily velocity does not affect this ordering."
        accent={match.accent}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <span className="label-mono">All-time stars</span>
          <span className="tabular text-[12px] text-muted-foreground">{repos.length} matching sample {repos.length === 1 ? "repo" : "repos"}</span>
        </div>
        <RepoList repos={repos} emptyText={`No sample repositories are tagged ${match.name}.`} />
      </PageShell>
      <SiteFooter />
    </>
  );
}
