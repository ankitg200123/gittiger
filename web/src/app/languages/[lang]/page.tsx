import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, Note, RepoList } from "@/components/page-shell";
import { REPOS, LANGUAGES } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import { mosaicFor } from "@/lib/mosaic";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LANGUAGES.map((l) => ({ lang: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const l = LANGUAGES.find((x) => x.slug === lang);
  if (!l) return { title: "Language not found" };
  const title = `Trending ${l.name} Repositories`;
  const description = `The fastest-growing ${l.name} repositories on GitHub, ranked daily by star velocity.`;
  return socialMetadata({
    title,
    description,
    path: `/languages/${encodeURIComponent(lang)}`,
    eyebrow: `PROGRAMMING LANGUAGE · ${l.name}`,
  });
}

export default async function LanguagePage({ params }: Props) {
  const { lang } = await params;
  const l = LANGUAGES.find((x) => x.slug === lang);
  if (!l) notFound();

  const matched = REPOS.filter((r) => {
    const rl = r.language?.toLowerCase();
    return rl === lang || rl === l.name.toLowerCase();
  });
  const repos = matched.length ? matched : REPOS;
  const title = `Trending ${l.name} Repositories`;
  const description = `The fastest-growing ${l.name} repositories on GitHub, ranked daily by star velocity.`;
  const path = `/languages/${encodeURIComponent(lang)}`;

  return (
    <>
      <CollectionJsonLd name={title} description={description} path={path} repos={repos} />
      <PageShell
        eyebrow={`Language · ${compact(l.count)} repos`}
        title={`Trending in ${l.name}`}
        description={`${l.name} repositories ranked by star velocity over the last 24 hours.`}
        accent={mosaicFor(l.slug)}
      >
        {!matched.length && (
          <Note>Sample data: no {l.name} repositories in the mock set, so all repositories are shown.</Note>
        )}
        <RepoList repos={repos} />
      </PageShell>
    </>
  );
}
