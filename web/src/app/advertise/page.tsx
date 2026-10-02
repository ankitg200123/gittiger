import type { Metadata } from "next";
import { PageShell, Section } from "@/components/content-shell";
import { EnquiryForm } from "@/components/enquiry-form";
import { GlassCard } from "@/components/glass-card";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "Advertise",
  description:
    "Self-serve ads on GitTiger at a flat $0.25 per click. Sidebar, in-feed and homepage sponsor placements.",
  path: "/advertise",
  eyebrow: "ADVERTISING",
});

const PLACEMENTS = [
  { name: "Sidebar", body: "A card in the right rail beside the trending list, visible on every ranked page." },
  { name: "In-feed", body: "A native row inside the list: after the 4th repository, then every 7th." },
  { name: "Homepage sponsor row", body: "The full-width sponsor strip above the homepage trending board." },
];

const GOOD = [
  "Developer tools, APIs, and infrastructure",
  "AI products, models, and agent frameworks",
  "Open-source projects looking for contributors",
  "Technical courses and books for engineers",
];
const BAD = [
  "Crypto, gambling, or adult products",
  "Anything misleading or malware-adjacent",
  "Consumer products with no developer angle",
  "Projects that violate GitHub's terms",
];

function List({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <GlassCard className="p-5">
      <span className={"label-mono " + tone}>{title}</span>
      <ul className="mt-4 space-y-2 text-[13.5px] text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </GlassCard>
  );
}

export default function AdvertisePage() {
  return (
    <PageShell
      eyebrow="Advertise"
      title="Self-serve ads for developer products"
      lede="Pay only when someone clicks. One flat price across every placement."
    >
      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:grid-cols-2">
        <div className="bg-background/60 p-5 backdrop-blur-md">
          <div className="label-mono">Price</div>
          <div className="tabular mt-2 text-[28px] font-semibold">$0.25<span className="text-[14px] text-muted-foreground font-normal"> / click</span></div>
        </div>
        <div className="bg-background/60 p-5 backdrop-blur-md">
          <div className="label-mono">Minimum</div>
          <div className="tabular mt-2 text-[28px] font-semibold">$50</div>
        </div>
      </div>

      <Section title="Placements">
        <div className="grid gap-4">
          {PLACEMENTS.map((p, i) => (
            <GlassCard key={p.name} lift className="flex gap-4 p-5">
              <span className="tabular text-[13px] text-mosaic-cyan pt-0.5">0{i + 1}</span>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">{p.name}</h3>
                <p className="mt-1 text-[13.5px]">{p.body}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </Section>

      <section className="grid gap-4 sm:grid-cols-2">
        <List title="Good fit" items={GOOD} tone="!text-mosaic-green" />
        <List title="Not a fit" items={BAD} tone="!text-mosaic-rose" />
      </section>

      <section>
        <h2 className="text-[22px] font-semibold tracking-tight mb-4">Request a campaign</h2>
        <EnquiryForm
          submitLabel="Request campaign"
          messageLabel="Campaign details"
          messagePlaceholder="Product, landing page URL, preferred placement, and budget."
          successTitle="Campaign request received"
          successBody="We'll review it and reply by email, usually within two working days."
          extraField={{ name: "url", label: "Landing page URL", placeholder: "https://example.com", type: "url", required: true }}
        />
      </section>
    </PageShell>
  );
}
