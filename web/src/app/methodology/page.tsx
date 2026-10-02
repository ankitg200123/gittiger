import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section, CodeCut } from "@/components/content-shell";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Methodology",
  description:
    "How GitTiger collects GitHub data and computes its trending score: stars_gained_24h² / ln(stars_total + 10).",
  path: "/methodology",
  eyebrow: "RANKING METHODOLOGY",
});

export default function MethodologyPage() {
  return (
    <PageShell
      eyebrow="Methodology"
      title="How the ranking works"
      lede="Everything on the board is derived from public GitHub activity with one documented formula. No editorial picks, no paid placement in the rankings."
    >
      <Section title="Data collection">
        <p>
          We ingest the public GitHub event archive every hour. Each hourly file contains the
          public events GitHub emitted during that hour; we filter it to star events (
          <code>WatchEvent</code>) and repository creation events, and aggregate them per
          repository. Repository metadata (description, language, topics, license, total stars) is
          refreshed from the GitHub API for repositories that appear in the ranked set.
        </p>
        <p>
          Because we read the event stream rather than scraping pages, the star deltas are counted
          directly instead of being inferred from two snapshots of a counter.
        </p>
      </Section>

      <Section title="Trending score">
        <p>For every repository we compute:</p>
        <CodeCut>{`score = stars_gained_24h² / ln(stars_total + 10)`}</CodeCut>
        <ul>
          <li><strong>stars_gained_24h</strong>: stars received over the trailing 24 hours. Squaring rewards genuine surges: 200 stars in a day is worth four times as much as 100, not twice.</li>
          <li><strong>ln(stars_total + 10)</strong>: a logarithmic damper. A project with a million stars needs proportionally more daily gain to rank than one with a thousand, but is not shut out. The +10 keeps brand-new repositories from dividing by near-zero.</li>
        </ul>
        <p>
          Hidden Gems applies the same formula restricted to repositories under 2,000 stars. Rising
          Stars favours repositories created recently.
        </p>
      </Section>

      <Section title="Freshness and archives">
        <p>
          The ingest job runs hourly and rankings are recomputed daily. Each day&apos;s ranking is
          frozen into an archive, which is what the weekly and monthly digests are built from, so
          past pages do not change after the fact. Digests are available from the{" "}
          <Link href="/weekly">weekly</Link> and <Link href="/monthly">monthly</Link> indexes.
        </p>
      </Section>

      <Section title="Known limitations">
        <ul>
          <li><strong>Star manipulation.</strong> Purchased or botted stars distort velocity. We apply basic filters for burst patterns from new accounts but cannot catch everything.</li>
          <li><strong>Stars are not quality.</strong> A viral post can produce a spike unrelated to how good the code is.</li>
          <li><strong>Un-starring.</strong> The event archive records stars given, not removed, so counts can drift slightly from GitHub&apos;s live number.</li>
          <li><strong>Archive gaps.</strong> Occasionally an hourly file is delayed or incomplete; affected hours are backfilled when the file arrives.</li>
          <li><strong>Scope.</strong> Only AI and developer-tool repositories are classified into topics, and classification is heuristic.</li>
        </ul>
      </Section>

      <Section title="Licensing and contact">
        <p>
          Aggregated rankings and statistics are published under CC0 1.0. Source repositories remain
          under their own licenses. Spotted a wrong ranking or a repository that should be
          excluded? <Link href="/contact">Tell us</Link>.
        </p>
      </Section>
    </PageShell>
  );
}
