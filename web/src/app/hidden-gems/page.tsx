import type { Metadata } from "next";
import { PageShell, Note, RepoList } from "@/components/page-shell";
import { REPOS } from "@/lib/mock-data";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Hidden Gems",
  description: "Repositories under 2,000 stars with strong recent momentum.",
  path: "/hidden-gems",
  eyebrow: "HIDDEN GEMS",
});

export default function HiddenGemsPage() {
  const under = REPOS.filter((r) => r.stars < 2000).sort((a, b) => b.score - a.score);
  const fallback = under.length < 3;
  const repos = fallback
    ? [...REPOS].sort((a, b) => a.stars - b.stars).slice(0, 8)
    : under;

  return (
    <>
      <CollectionJsonLd
        name="Hidden-gem repositories"
        description="Repositories under 2,000 stars with strong recent momentum."
        path="/hidden-gems"
        repos={repos}
      />
      <PageShell
        eyebrow="Discover · Hidden Gems"
        title="Hidden gems"
        description="Under 2,000 stars with strong recent momentum. The projects worth finding before everyone else does."
        accent="#22c55e"
      >
        {fallback && (
          <Note>Sample data: few mock repositories are under 2,000 stars, so the {repos.length} lowest-starred are shown.</Note>
        )}
        <RepoList repos={repos} />
      </PageShell>
    </>
  );
}
