import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell, RepoList } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { REPOSITORY_LETTERS, REPOSITORY_GROUPS, reposForInitial } from "@/lib/discovery";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ letter: string }> };
const VALID_LETTERS = new Set(REPOSITORY_LETTERS);

export function generateStaticParams() {
  return REPOSITORY_LETTERS.map((letter) => ({ letter }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { letter } = await params;
  const heading = letter === "0-9" ? "0–9" : letter.toUpperCase();
  if (!VALID_LETTERS.has(letter)) return { title: "Repository group not found" };
  const title = `Repositories beginning with ${heading}`;
  return socialMetadata({
    title,
    description: `Browse ${reposForInitial(letter).length} repositories whose owners begin with ${heading}.`,
    path: `/repositories/${encodeURIComponent(letter)}`,
    eyebrow: "REPOSITORY DIRECTORY · A–Z",
  });
}

export default async function RepositoryLetterPage({ params }: Props) {
  const { letter } = await params;
  if (!VALID_LETTERS.has(letter)) notFound();
  const repos = reposForInitial(letter);
  const heading = letter === "0-9" ? "0–9" : letter.toUpperCase();
  const isNumeric = /^[0-9]$/.test(letter);
  const breadcrumbs = letter === "0-9" ? REPOSITORY_GROUPS.slice(0, -1) : REPOSITORY_GROUPS;

  return (
    <>
      <CollectionJsonLd
        name={`Owners beginning with ${heading}`}
        description={`${repos.length} ${repos.length === 1 ? "repository" : "repositories"} in the current sample.`}
        path={`/repositories/${encodeURIComponent(letter)}`}
        repos={repos}
      />
      <PageShell
        eyebrow="Repositories · A–Z"
        title={`Owners beginning with ${heading}`}
        description={`${repos.length} ${repos.length === 1 ? "repository" : "repositories"} in the current sample.`}
      >
        {isNumeric && (
          <p className="mb-5 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] text-muted-foreground">
            No repository owners with this numeric initial are in the current sample.
          </p>
        )}
        <RepoList repos={repos} emptyText={`No repository owners beginning with ${heading} are in this sample.`} />
        <nav aria-label="Repository initials" className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5">
          {breadcrumbs.map((initial) => (
            <a
              key={initial}
              href={`/repositories/${initial}`}
              aria-current={initial === letter ? "page" : undefined}
              className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border px-3 text-[11px] transition-colors ${initial === letter ? "border-white/25 bg-white/[0.07] text-foreground" : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"}`}
            >
              {initial === "0-9" ? "0–9" : initial.toUpperCase()}
            </a>
          ))}
        </nav>
      </PageShell>
      <SiteFooter />
    </>
  );
}
