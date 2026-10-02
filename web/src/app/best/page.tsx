import { PageShell, IndexGrid } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { TOPICS } from "@/lib/mock-data";
import { socialMetadata } from "@/lib/seo";

export const metadata = socialMetadata({
  title: "Best Repositories by Topic",
  description: "Explore repositories by topic, ranked by all-time stars.",
  path: "/best",
  eyebrow: "ALL-TIME REPOSITORY LEADERS",
});

export default function BestPage() {
  const topics = [...TOPICS].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <PageShell
        eyebrow="Library · All-time leaders"
        title="Best by topic"
        description="Choose a topic to see its matching repositories ordered by all-time star total, not daily velocity."
      >
        <IndexGrid items={topics.map((topic) => ({
          slug: topic.slug,
          name: topic.name,
          count: topic.count,
          accent: topic.accent,
          href: `/best/${topic.slug}`,
        }))} />
        <p className="mt-5 text-[11.5px] text-muted-foreground/75">Topic cards show indexed catalogue counts; matching results below use the local repository sample.</p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
