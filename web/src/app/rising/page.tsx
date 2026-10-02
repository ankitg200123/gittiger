import type { Metadata } from "next";
import { PageShell, Note, RepoList } from "@/components/page-shell";
import { REPOS } from "@/lib/mock-data";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Rising Repositories",
  description: "Repositories created in the last 6 months that are gaining traction fast.",
  path: "/rising",
  eyebrow: "RISING REPOSITORIES",
});

const DAY = 86_400_000;
const RISING_WINDOW_MS = 180 * DAY;
const RISING_CUTOFF = Date.now() - RISING_WINDOW_MS;

export default function RisingPage() {
  const fresh = REPOS.filter((r) => new Date(r.createdAt).getTime() >= RISING_CUTOFF);
  const repos = [...fresh].sort((a, b) => b.score - a.score);

  return (
    <>
      <CollectionJsonLd
        name="Rising repositories"
        description="Repositories created in the last six months and gaining traction fast."
        path="/rising"
        repos={repos}
      />
      <PageShell
        eyebrow="Discover · Rising"
        title="Rising stars"
        description="Created in the last 6 months and gaining traction fast, ranked by star velocity."
        accent="#fb7185"
      >
        {repos.length ? (
          <RepoList repos={repos} />
        ) : (
          <Note>No repositories created in the last 180 days yet.</Note>
        )}
      </PageShell>
    </>
  );
}
