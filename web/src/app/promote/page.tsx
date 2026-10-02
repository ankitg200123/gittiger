import type { Metadata } from "next";
import { PageShell, Section } from "@/components/content-shell";
import { EnquiryForm } from "@/components/enquiry-form";
import { GlassCard } from "@/components/glass-card";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Promote your project",
  description:
    "We make a short reel about your GitHub repository and post it to the @gittiger Instagram.",
  path: "/promote",
  eyebrow: "PROMOTE YOUR PROJECT",
});

const POINTS = [
  { k: "Posted", v: "Reels go live on @gittiger" },
  { k: "No approval step", v: "Keeps the price down" },
  { k: "Refund", v: "Full, if we can't make it" },
];

export default function PromotePage() {
  return (
    <PageShell
      eyebrow="Promote"
      title="Put your project in front of developers"
      lede="Send us a GitHub link. We make a short reel about your repository and post it to the @gittiger Instagram."
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-3">
        {POINTS.map((p) => (
          <div key={p.k} className="bg-background/60 p-4 backdrop-blur-md">
            <div className="label-mono">{p.k}</div>
            <div className="mt-2 text-[13.5px] text-foreground">{p.v}</div>
          </div>
        ))}
      </div>

      <Section title="How it works">
        <ul>
          <li><strong>You send the repo.</strong> A GitHub link and a sentence on what it does.</li>
          <li><strong>We make the reel.</strong> A short vertical video explaining the project to developers.</li>
          <li><strong>We post it.</strong> It goes on @gittiger. Reels are posted as made, with no approval round, which is how we keep the price low.</li>
          <li><strong>Full refund if we can&apos;t.</strong> If we cannot make a reel that does your project justice, you get all your money back.</li>
        </ul>
      </Section>

      <section>
        <h2 className="text-[22px] font-semibold tracking-tight mb-4">Send an enquiry</h2>
        <EnquiryForm
          submitLabel="Send enquiry"
          messagePlaceholder="What does the project do, and who is it for?"
          successTitle="Thanks, we've got your enquiry"
          successBody="We'll reply by email with a quote and next steps."
          extraField={{ name: "github", label: "GitHub link", placeholder: "https://github.com/owner/repo", type: "url", required: true }}
        />
      </section>

      <GlassCard className="p-5">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Promotion is separate from rankings. Paying us never changes where a repository appears on the trending board.
        </p>
      </GlassCard>
    </PageShell>
  );
}
