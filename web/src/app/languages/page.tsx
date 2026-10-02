import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { GlassCard } from "@/components/glass-card";
import { LANGUAGES } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import { mosaicFor } from "@/lib/mosaic";
import { socialMetadata } from "@/lib/seo";

export const metadata: Metadata = socialMetadata({
  title: "All Languages",
  description: "Trending repositories by programming language.",
  path: "/languages",
  eyebrow: "BROWSE LANGUAGES",
});

export default function LanguagesPage() {
  const max = Math.max(...LANGUAGES.map((l) => l.count));
  return (
    <PageShell
      eyebrow="Browse"
      title="All languages"
      description="Trending repositories grouped by primary programming language."
    >
      <GlassCard className="overflow-hidden divide-y divide-white/[0.07]">
        {LANGUAGES.map((l) => {
          const color = mosaicFor(l.slug);
          return (
            <Link
              key={l.slug}
              href={`/languages/${l.slug}`}
              className="group flex items-center gap-4 px-5 py-4 transition-colors duration-200 hover:bg-white/[0.035] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              <span className="w-28 shrink-0 text-[14.5px] font-semibold">{l.name}</span>
              <span className="hidden sm:block h-1 flex-1 overflow-hidden rounded-full bg-white/5" aria-hidden>
                <span className="block h-full rounded-full" style={{ width: `${(l.count / max) * 100}%`, backgroundColor: color, opacity: 0.8 }} />
              </span>
              <span className="tabular ml-auto text-[13px] text-muted-foreground">{compact(l.count)} repos</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all duration-200 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          );
        })}
      </GlassCard>
    </PageShell>
  );
}
