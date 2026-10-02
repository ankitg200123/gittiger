import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { MONTHLY, REPOS, starHistory } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import type { Repo } from "@/lib/types";
import { CollectionJsonLd } from "@/components/json-ld";
import { socialMetadata } from "@/lib/seo";

type Props = { params: Promise<{ month: string }> };

function isValidMonth(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return year > 0 && month >= 1 && month <= 12;
}

function labelForMonth(value: string): string {
  const [yearText, monthText] = value.split("-");
  const date = new Date(0);
  date.setUTCFullYear(Number(yearText), Number(monthText) - 1, 1);
  date.setUTCHours(0, 0, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function topForMonth(repos: Repo[]) {
  return repos
    .map((repo) => {
      const history = starHistory(repo.slug, 30);
      return { repo, gained: history[history.length - 1] - history[0] };
    })
    .sort((a, b) => b.gained - a.gained || a.repo.slug.localeCompare(b.repo.slug))
    .slice(0, 15);
}

export function generateStaticParams() {
  return MONTHLY.map((digest) => ({ month: digest.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  if (!isValidMonth(month)) return { title: "Monthly digest not found" };
  const title = `${labelForMonth(month)} Digest`;
  return socialMetadata({
    title,
    description: `Monthly trending repository digest for ${labelForMonth(month)}.`,
    path: `/monthly/${encodeURIComponent(month)}`,
    eyebrow: `MONTHLY DIGEST · ${month}`,
  });
}

export default async function MonthlyDigestPage({ params }: Props) {
  const { month } = await params;
  if (!isValidMonth(month)) notFound();
  const rows = topForMonth(REPOS);
  const archiveLabel = MONTHLY.find((digest) => digest.slug === month)?.label ?? labelForMonth(month);
  const repos = rows.map(({ repo }) => repo);
  const description = `Top repositories for ${archiveLabel}, ordered by generated 30-day star gain.`;

  return (
    <>
      <CollectionJsonLd
        name={`${archiveLabel} Digest`}
        description={description}
        path={`/monthly/${encodeURIComponent(month)}`}
        repos={repos}
      />
      <PageShell
        eyebrow={`Monthly digest · ${month}`}
        title={archiveLabel}
        description="The top 15 repositories in the sample, ordered by generated 30-day star gain."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3">
          <span className="label-mono">Top 15 · 30-day sample gain</span>
          <span className="tabular text-[12px] text-muted-foreground">{rows.length} repositories · {month}</span>
        </div>
        <div className="glass overflow-hidden divide-y divide-white/[0.07]">
          {rows.map(({ repo, gained }, index) => (
            <div key={repo.slug} className="flex items-center gap-3 px-4 py-4 sm:gap-4">
              <span className="rank shrink-0">{String(index + 1).padStart(2, "0")}</span>
              <Image
                src={repo.avatarUrl}
                alt=""
                width={36}
                height={36}
                loading="lazy"
                unoptimized
                className="h-9 w-9 shrink-0 rounded-lg border border-white/10 bg-white/5"
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`}
                  className="inline-flex max-w-full items-center gap-1 text-[13.5px] font-medium hover:text-mosaic-cyan"
                >
                  <span className="truncate">{repo.slug}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </Link>
                <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">{repo.description}</p>
              </div>
              <div className="tabular shrink-0 text-right">
                <p className="text-[13px] font-medium text-mosaic-green">+{compact(gained)}</p>
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">30d sample</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[11.5px] text-muted-foreground/75">
          Star gains are derived from the app&apos;s generated sample histories, not observed monthly GitHub snapshots.
        </p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
