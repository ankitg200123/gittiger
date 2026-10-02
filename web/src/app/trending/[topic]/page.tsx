import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, Note, RepoList } from "@/components/page-shell";
import { REPOS, TOPICS } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ topic: string }> };

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const t = TOPICS.find((x) => x.slug === topic);
  if (!t) return { title: "Topic not found" };
  const title = `Trending ${t.name} Repositories`;
  const description = `The fastest-growing ${t.name} repositories on GitHub, ranked daily by star velocity.`;
  return socialMetadata({
    title,
    description,
    path: `/trending/${encodeURIComponent(topic)}`,
    eyebrow: `TRENDING TOPIC · ${t.name}`,
  });
}

export default async function TopicPage({ params }: Props) {
  const { topic } = await params;
  const t = TOPICS.find((x) => x.slug === topic);
  if (!t) notFound();

  const matched = REPOS.filter((r) => r.topics.includes(topic));
  const repos = matched.length ? matched : REPOS.slice(0, 8);
  const title = `Trending ${t.name} Repositories`;
  const description = `The fastest-growing ${t.name} repositories on GitHub, ranked daily by star velocity.`;

  return (
    <>
      <CollectionJsonLd name={title} description={description} path={`/trending/${encodeURIComponent(topic)}`} repos={repos} />
      <PageShell
        eyebrow={`Topic · ${compact(t.count)} repos`}
        title={`Trending in ${t.name}`}
        description={`Repositories tagged ${t.name}, ranked by star velocity over the last 24 hours.`}
        accent={t.accent}
      >
        {!matched.length && (
          <Note>Sample data: no repositories are tagged {t.name} yet, so the overall top {repos.length} is shown.</Note>
        )}
        <RepoList repos={repos} />
      </PageShell>
    </>
  );
}
