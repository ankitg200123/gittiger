import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { RepoList, PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { DEVELOPERS, reposForOwner } from "@/lib/discovery";
import { compact } from "@/lib/format";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ owner: string }> };

export function generateStaticParams() {
  return DEVELOPERS.map((developer) => ({ owner: developer.owner }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner } = await params;
  const developer = DEVELOPERS.find((candidate) => candidate.owner.toLowerCase() === owner.toLowerCase());
  if (!developer) return { title: "Developer not found" };
  const title = `${developer.owner} repositories`;
  const description = `${developer.repos.length} repositories by ${developer.owner}, with ${compact(developer.starsGained)} stars gained today across the sample.`;
  return socialMetadata({
    title,
    description,
    path: `/user/${encodeURIComponent(developer.owner)}`,
    eyebrow: `DEVELOPER · ${developer.owner}`,
  });
}

export default async function UserPage({ params }: Props) {
  const { owner } = await params;
  const repos = reposForOwner(owner);
  if (repos.length === 0) notFound();
  const developer = DEVELOPERS.find((candidate) => candidate.owner.toLowerCase() === owner.toLowerCase());
  const canonicalOwner = repos[0].owner;
  const title = `${canonicalOwner} repositories`;
  const description = `${repos.length} ${repos.length === 1 ? "repository" : "repositories"} by ${canonicalOwner}, with ${compact(developer?.starsGained ?? 0)} stars gained today across the sample.`;
  const path = `/user/${encodeURIComponent(canonicalOwner)}`;

  return (
    <>
      <CollectionJsonLd name={title} description={description} path={path} repos={repos} />
      <PageShell
        eyebrow="Developer · Repository owner"
        title={canonicalOwner}
        description={`${repos.length} ${repos.length === 1 ? "repository" : "repositories"} in the sample, with ${compact(developer?.starsGained ?? 0)} stars gained today in total.`}
      >
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
          <Image src={repos[0].avatarUrl} alt={`${canonicalOwner} avatar`} width={56} height={56} unoptimized className="h-14 w-14 rounded-xl border border-white/10 bg-white/5" />
          <div>
            <p className="label-mono">Owner profile</p>
            <p className="mt-2 text-[13px] font-medium">{canonicalOwner}</p>
          </div>
          <div className="tabular ml-auto text-right">
            <p className="text-[20px] font-semibold text-mosaic-green">+{compact(developer?.starsGained ?? 0)}</p>
            <p className="text-[10.5px] text-muted-foreground">stars today</p>
          </div>
        </div>
        <RepoList repos={repos} emptyText="This developer has no repositories in the current sample." />
        <p className="mt-4 text-[11.5px] text-muted-foreground/75">Repository rows retain the shared ranking context; this list is filtered to the selected owner.</p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
