import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { MONTHLY, REPOS } from "@/lib/mock-data";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

export const metadata = socialMetadata({
  title: "Monthly Digests",
  description: "Browse month-by-month repository digests.",
  path: "/monthly",
  eyebrow: "MONTHLY REPOSITORY ARCHIVE",
});

export default function MonthlyPage() {
  return (
    <>
      <CollectionJsonLd
        name="Monthly Repositories"
        description="Monthly digests of the repositories in the current sample."
        path="/monthly"
        repos={REPOS}
      />
      <PageShell
        eyebrow="Archive · Monthly"
        title="Monthly digests"
        description="Browse the monthly archive. Each digest ranks the bundled sample by its generated 30-day star history."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MONTHLY.map((month, index) => (
            <Link
              key={month.slug}
              href={month.href}
              className="glass lift group flex min-h-44 flex-col justify-between p-5 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="label-mono">{String(index + 1).padStart(2, "0")} / archive</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <div>
                <h2 className="text-[19px] font-semibold tracking-tight">{month.label}</h2>
                <p className="tabular mt-2 text-[12px] text-muted-foreground">{month.slug}</p>
              </div>
              <span className="text-[12px] text-muted-foreground">View monthly top 15</span>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-[11.5px] text-muted-foreground/75">
          The archive uses sample star-history data until historical snapshots are connected.
        </p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
