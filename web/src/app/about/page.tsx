import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section, CodeCut } from "@/components/content-shell";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "About",
  description:
    "GitTiger ranks AI and developer-tool repositories on GitHub by star velocity. Open CC0 data, hourly updates.",
  path: "/about",
  eyebrow: "ABOUT LOGIC MOSAIC TRENDS",
});

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="A daily ranking of what developers are building"
      lede="GitTiger tracks public GitHub repositories and ranks them by how fast they are gaining stars, not how many they already have."
    >
      <Section title="What this site is">
        <p>
          Most “top repositories” lists are dominated by projects that became famous years ago.
          We care about the opposite question: <strong>what is picking up momentum right now?</strong>{" "}
          Every day we rank repositories by recent star velocity so a two-week-old agent framework
          can outrank a decade-old library that is merely large.
        </p>
      </Section>

      <Section title="The ranking formula">
        <p>Each repository gets a trending score. Velocity is squared so real surges beat slow drift, and a logarithmic penalty on total stars stops very large projects from dominating forever.</p>
        <CodeCut>{`score = stars_gained_24h² / ln(stars_total + 10)`}</CodeCut>
        <p>
          The full derivation, data sources and caveats are on the{" "}
          <Link href="/methodology">methodology page</Link>.
        </p>
      </Section>

      <Section title="Niche focus: AI and developer tools">
        <p>
          We deliberately do not try to cover all of GitHub. The board concentrates on AI agents, MCP
          servers, RAG, local LLMs, coding assistants, vector databases, and the developer tooling
          around them. A narrower scope means better topic pages, fewer irrelevant entries, and a
          list you can actually scan in a minute.
        </p>
      </Section>

      <Section title="Open data (CC0)">
        <p>
          The rankings and aggregated statistics we publish are released under{" "}
          <strong>CC0 1.0</strong>: public domain. Use them in research, newsletters, dashboards or
          your own products without asking and without attribution, though a link back is
          appreciated. Underlying repository content stays under each project&apos;s own license.
        </p>
      </Section>

      <Section title="Get involved">
        <ul>
          <li><Link href="/promote">Promote your project</Link> with a short reel on our Instagram.</li>
          <li><Link href="/advertise">Advertise</Link> on the site with per-click pricing.</li>
          <li><Link href="/contact">Contact us</Link> with corrections or ideas.</li>
        </ul>
      </Section>
    </PageShell>
  );
}
