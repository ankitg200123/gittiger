import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Section } from "@/components/content-shell";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Privacy",
  description: "What GitTiger collects and how it is used.",
  path: "/privacy",
  eyebrow: "PRIVACY POLICY",
});

export default function PrivacyPage() {
  return (
    <PageShell eyebrow="Legal" title="Privacy policy" lede="Short version: we collect very little, and we do not sell it.">
      <Section title="What we publish">
        <p>Rankings are built from public GitHub data: repository names, descriptions, star counts, and the public usernames of repository owners. Nothing private is accessed.</p>
      </Section>
      <Section title="What we collect from visitors">
        <ul>
          <li><strong>Basic analytics.</strong> Aggregate page views and referrers, used to understand which pages are useful.</li>
          <li><strong>Ad clicks.</strong> Clicks on sponsored placements are counted so advertisers can be billed.</li>
          <li><strong>Forms.</strong> If you submit a promote, advertise, or contact form, we receive the name, email, links, and message you enter, and use them only to reply to you.</li>
        </ul>
      </Section>
      <Section title="Cookies">
        <p>We use no advertising cookies and no cross-site tracking. Any cookie we set is for basic site function or aggregate measurement.</p>
      </Section>
      <Section title="Sharing">
        <p>We do not sell personal data. We use service providers (hosting, email, analytics) who process data on our behalf.</p>
      </Section>
      <Section title="Removal and your rights">
        <p>If your repository or username should not appear, or you want data we hold about you deleted, <Link href="/contact">contact us</Link> and we will act on it promptly.</p>
      </Section>
    </PageShell>
  );
}
