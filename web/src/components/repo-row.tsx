import Link from "next/link";
import { Star, GitFork, ArrowUpRight } from "lucide-react";
import { cn } from "cn";
import type { Repo } from "@/lib/types";
import { compact, relativeTime } from "@/lib/format";
import { rankColor } from "@/lib/mosaic";
import { Sparkline } from "./sparkline";
import { starHistory } from "@/lib/mock-data";
import { cssVars } from "@/lib/style";

type Props = { repo: Repo; compact?: boolean };

export function RepoRow({ repo, compact: isCompact = false }: Props) {
  const hist = starHistory(repo.slug, 14);

  return (
    <Link
      href={`/repo/${repo.owner}/${repo.name}`}
      className={cn(
        "group relative flex items-center gap-4 px-4 py-3.5",
        "transition-colors duration-200 hover:bg-white/[0.035]",
        "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-[-2px]",
      )}
    >
      <span
        className={cn(
          "rank shrink-0",
          repo.rank <= 3 && "rank-top",
        )}
        style={repo.rank <= 3 ? cssVars({ "--rank-color": rankColor(repo.rank) }) : undefined}
      >
        {repo.rank}
      </span>

      <img
        src={repo.avatarUrl}
        alt=""
        width={36}
        height={36}
        loading="lazy"
        className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-muted-foreground text-[13.5px] truncate">{repo.owner}</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-semibold text-[14.5px] truncate group-hover:text-white transition-colors">
            {repo.name}
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/0 -ml-0.5 transition-all duration-200 group-hover:text-mosaic-cyan group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        {!isCompact && (
          <p className="text-[13px] text-muted-foreground line-clamp-1 mt-0.5">
            {repo.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {repo.language && (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: repo.accent }}
                aria-hidden
              />
              {repo.language}
            </span>
          )}
          {repo.topics.slice(0, 3).map((t) => (
            <span
              key={t}
              className="chip"
              style={cssVars({ "--chip-color": repo.accent })}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Data rail — every number in mono, hard right-aligned */}
      <div className="hidden sm:flex items-center gap-5 shrink-0">
        <Sparkline
          data={hist}
          color={repo.accent}
          width={72}
          height={26}
          className="spark"
          aria-label={`${repo.slug} star history`}
        />
        <div className="text-right tabular w-[68px]">
          <div className="flex items-center justify-end gap-1 text-[13px]">
            <Star className="h-3 w-3 text-mosaic-amber" fill="currentColor" />
            {compact(repo.stars)}
          </div>
          <div className="text-[10.5px] text-muted-foreground mt-0.5">
            {compact(repo.forks)} forks
          </div>
        </div>
        <div className="text-right tabular w-[74px]">
          <div className="text-mosaic-green text-[13px] font-medium">
            +{compact(repo.starsToday)}
          </div>
          <div className="text-[10.5px] text-muted-foreground mt-0.5">today</div>
        </div>
      </div>
    </Link>
  );
}
