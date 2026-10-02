import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { REPOSITORY_LETTERS, REPOSITORY_GROUPS, reposForInitial } from "@/lib/discovery";
import { socialMetadata } from "@/lib/seo";

export const metadata = socialMetadata({
  title: "Browse Repositories A–Z",
  description: "Browse repository owners alphabetically, including numeric prefixes.",
  path: "/repositories",
  eyebrow: "REPOSITORY DIRECTORY",
});

function countFor(initial: string): number {
  return reposForInitial(initial).length;
}

export default function RepositoriesPage() {
  return (
    <>
      <PageShell
        eyebrow="Browse · Owners"
        title="Repositories A–Z"
        description="Choose an owner initial to browse the repositories in the current sample. Numeric-prefix owners are grouped under 0–9."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {REPOSITORY_GROUPS.map((group) => (
            <Link
              key={group}
              href={`/repositories/${group}`}
              className="glass lift group flex min-h-28 flex-col justify-between p-4 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="tabular text-[25px] font-semibold uppercase">
                  {group === "0-9" ? "0–9" : group.toUpperCase()}
                </span>
                <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
              <span className="tabular text-[11px] text-muted-foreground">
                {countFor(group)} {countFor(group) === 1 ? "owner" : "owners"}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="label-mono">Digits</p>
          <p className="mt-2 text-[12px] text-muted-foreground">Individual numeric initials are also available.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {REPOSITORY_LETTERS.filter((letter) => /^[0-9]$/.test(letter)).map((digit) => (
              <Link
                key={digit}
                href={`/repositories/${digit}`}
                className="tabular inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] px-3 text-[12px] text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
              >
                {digit}
              </Link>
            ))}
          </div>
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
