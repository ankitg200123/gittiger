import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { GlassCard } from "@/components/glass-card";
import { TOPICS } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import { cssVars } from "@/lib/style";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "All Topics",
  description: "Browse every tracked topic, from AI agents to vector databases, ranked by repository count.",
  path: "/topics",
  eyebrow: "BROWSE TOPICS",
});

export default function TopicsPage() {
  const sorted = [...TOPICS].sort((a, b) => b.count - a.count);
  return (
    <PageShell
      eyebrow="Browse"
      title="All topics"
      description="Every topic we track, each with its own hue. Pick one to see its repositories ranked by star velocity."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((t) => (
          <Link
            key={t.slug}
            href={`/trending/${t.slug}`}
            className="group block focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded-xl"
          >
            <GlassCard lift className="relative overflow-hidden p-5" style={cssVars({ "--chip-color": t.accent })}>
              <span
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(90deg, ${t.accent}, transparent)` }}
                aria-hidden
              />
              <div className="flex items-start justify-between gap-3">
                <span className="chip">{t.name}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div className="tabular mt-6 text-[30px] font-semibold leading-none">{compact(t.count)}</div>
              <div className="label-mono mt-2">repositories</div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
