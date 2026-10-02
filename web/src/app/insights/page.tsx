import { HorizontalBarChart, VelocityHistogram } from "@/components/insight-charts";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { LANGUAGES, REPOS, SITE, TOPICS } from "@/lib/mock-data";
import { compact, full } from "@/lib/format";
import { socialMetadata } from "@/lib/seo";

export const metadata = socialMetadata({
  title: "Repository Insights",
  description: "A visual overview of the repository, language, topic, and star-velocity sample.",
  path: "/insights",
  eyebrow: "REPOSITORY DATA INSIGHTS",
});

export default function InsightsPage() {
  const stats = [
    { label: "Repositories in sample", value: String(REPOS.length), detail: "current build" },
    { label: "Repos tracked", value: compact(SITE.totalTracked), detail: "site counter" },
    { label: "Active ranking", value: compact(SITE.activeRanked), detail: "daily" },
    { label: "Topics indexed", value: String(TOPICS.length), detail: "taxonomy sample" },
  ];
  const languages = [...LANGUAGES]
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
    .map((language) => ({ label: language.name, value: language.count }));
  const topics = [...TOPICS]
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)
    .map((topic) => ({ label: topic.name, value: topic.count }));

  return (
    <>
      <PageShell
        eyebrow="Analytics · Sample snapshot"
        title="Repository insights"
        description="A compact read on the language mix, star velocity, and topics across the records bundled with this build."
      >
        <section aria-label="Overview statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass p-5">
              <p className="label-mono">{stat.label}</p>
              <p className="tabular mt-3 text-[28px] font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{stat.detail}</p>
            </div>
          ))}
        </section>

        <section className="mt-5 grid gap-5">
          <div className="glass min-w-0 p-5 sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="label-mono">Language distribution</p>
                <h2 className="mt-2 text-[17px] font-semibold">Top languages</h2>
              </div>
              <span className="tabular text-[11px] text-muted-foreground">records</span>
            </div>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Top languages chart">
              <HorizontalBarChart
                data={languages}
                color="#22d3ee"
                ariaLabel="Top seven programming languages by indexed repository count"
              />
            </div>
          </div>

          <div className="glass min-w-0 p-5 sm:p-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="label-mono">Daily movement</p>
                <h2 className="mt-2 text-[17px] font-semibold">Star-velocity histogram</h2>
              </div>
              <span className="tabular text-[11px] text-muted-foreground">stars · today</span>
            </div>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Daily star velocity histogram">
              <VelocityHistogram values={REPOS.map((repo) => repo.starsToday)} />
            </div>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              Bars group sample repositories by their daily star-gain range; counts appear above each bar.
            </p>
          </div>

          <div className="glass min-w-0 p-5 sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="label-mono">Topic coverage</p>
                <h2 className="mt-2 text-[17px] font-semibold">Top topics</h2>
              </div>
              <span className="tabular text-[11px] text-muted-foreground">indexed repos</span>
            </div>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Top topics chart">
              <HorizontalBarChart
                data={topics}
                color="#7c5cff"
                ariaLabel="Top seven topics by indexed repository count"
              />
            </div>
          </div>
        </section>

        <p className="mt-5 text-[11.5px] text-muted-foreground/75">
          Counts are displayed as received from the bundled sample dataset; they are not a live GitHub query.
          Language and topic values: {full(languages.reduce((sum, item) => sum + item.value, 0))} across the shown categories.
        </p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
