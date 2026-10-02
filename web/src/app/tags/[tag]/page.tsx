import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, RepoList } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { tagCounts } from "@/lib/discovery";
import { REPOS } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ tag: string }> };

const TAGS = tagCounts();

export function generateStaticParams() {
  return TAGS.map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const match = TAGS.find((entry) => entry.tag === tag);
  if (!match) return { title: "Tag not found" };
  const title = `Repositories tagged ${match.tag}`;
  const description = `Browse ${match.count} repositories with the ${match.tag} tag.`;
  return socialMetadata({
    title,
    description,
    path: `/tags/${encodeURIComponent(match.tag)}`,
    eyebrow: `REPOSITORY TAG · ${match.tag}`,
  });
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const match = TAGS.find((entry) => entry.tag === tag);
  if (!match) notFound();
  const repos = REPOS.filter((repo) => repo.topics.includes(tag));
  const title = `Repositories tagged ${match.tag}`;
  const description = `Browse ${match.count} repositories with the ${match.tag} tag.`;
  const path = `/tags/${encodeURIComponent(match.tag)}`;

  return (
    <>
      <CollectionJsonLd name={title} description={description} path={path} repos={repos} />
      <PageShell
        eyebrow={`Tag · ${compact(match.count)} ${match.count === 1 ? "repo" : "repos"}`}
        title={match.tag}
        description={`Repositories carrying the ${match.tag} tag in the current sample.`}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <span className="label-mono">Exact tag match</span>
          <span className="tabular text-[12px] text-muted-foreground">{repos.length} {repos.length === 1 ? "sample repository" : "sample repositories"}</span>
        </div>
        <RepoList repos={repos} emptyText={`No repositories tagged ${match.tag} are in this sample.`} />
      </PageShell>
      <SiteFooter />
    </>
  );
}
