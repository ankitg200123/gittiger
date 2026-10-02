"use client";

import Link from "next/link";
import { useState } from "react";
import type { Repo } from "@/lib/types";
import { compareHref } from "@/lib/discovery";
import { compact } from "@/lib/format";

export function RepoComparisonPicker({ repos }: { repos: Repo[] }) {
  const [repoA, setRepoA] = useState<Repo | null>(null);
  const [repoB, setRepoB] = useState<Repo | null>(null);

  function column(
    label: string,
    selected: Repo | null,
    other: Repo | null,
    setSelected: (repo: Repo) => void,
  ) {
    return (
      <section className="glass p-4 sm:p-5" aria-label={label}>
        <h2 className="text-sm font-semibold">{label}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {selected ? `Selected ${selected.slug}` : "Choose one of the sample repositories."}
        </p>
        <div className="mt-4 grid gap-2">
          {repos.map((repo, index) => {
            const isSelected = selected?.slug === repo.slug;
            const isUnavailable = other?.slug === repo.slug;
            return (
              <button
                key={repo.slug}
                type="button"
                aria-pressed={isSelected}
                disabled={isUnavailable}
                onClick={() => setSelected(repo)}
                className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? "border-mosaic-violet/60 bg-mosaic-violet/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.045]"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                <span className="rank shrink-0">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{repo.slug}</span>
                  <span className="tabular mt-0.5 block text-[11px] text-muted-foreground">
                    {compact(repo.stars)} stars · +{compact(repo.starsToday)} today
                  </span>
                </span>
                {isSelected && <span className="label-mono text-mosaic-cyan">Selected</span>}
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-2">
        {column("Repository A", repoA, repoB, setRepoA)}
        {column("Repository B", repoB, repoA, setRepoB)}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <p className="text-[13px] text-muted-foreground" aria-live="polite">
          {repoA && repoB
            ? `${repoA.slug} compared with ${repoB.slug}`
            : "Select one repository in each column to compare."}
        </p>
        {repoA && repoB ? (
          <Link
            href={compareHref(repoA, repoB)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
          >
            Compare repositories
          </Link>
        ) : (
          <span className="label-mono">2 selections required</span>
        )}
      </div>
    </div>
  );
}
