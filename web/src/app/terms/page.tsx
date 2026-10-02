import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/content-shell";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Terms",
  description: "Terms of use for GitTiger.",
  path: "/terms",
  eyebrow: "TERMS OF USE",
});

export default function TermsPage() {
  return (
    <PageShell eyebrow="Legal" title="Terms of use" lede="By using this site you agree to the terms below.">
      <Section title="Use of the site">
        <p>You may browse and share the site freely. Do not scrape it in a way that degrades service, or attempt to interfere with its operation. Automated access should respect <code>robots.txt</code>.</p>
      </Section>
      <Section title="Data and licensing">
        <p>Aggregated rankings and statistics are released under CC0 1.0. Repository content, names, and logos belong to their respective owners and licenses.</p>
      </Section>
      <Section title="No warranty">
        <p>Rankings are provided as is, derived from public data and a documented heuristic (see <Link href="/methodology">methodology</Link>). We make no guarantee of accuracy, completeness, or availability, and a ranking is not an endorsement or a security review.</p>
      </Section>
      <Section title="Promotion and advertising">
        <p>Paid promotion and advertising are separate from rankings and never change them. We may decline or remove any campaign at our discretion. Reel promotions are refunded in full if we cannot produce the reel. Ad clicks are billed at the rate shown on the <Link href="/advertise">advertise page</Link>.</p>
      </Section>
      <Section title="Liability">
        <p>To the extent permitted by law, we are not liable for indirect or consequential loss arising from use of the site.</p>
      </Section>
      <Section title="Changes and contact">
        <p>We may update these terms as the service evolves. Questions? <Link href="/contact">Contact us</Link>.</p>
      </Section>
    </PageShell>
  );
}
