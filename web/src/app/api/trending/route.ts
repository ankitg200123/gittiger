/**
 * GET /api/trending — public ranked list in JSON.
 *
 * Mirrors gittrend.io's public endpoint so anything built against their API can
 * point here. CC0 data. No auth, no rate limit beyond Cloudflare's cache.
 *
 *   GET /api/trending?limit=25&topic=ai-agent
 */
import { NextResponse } from "next/server";
import { getTrending } from "@/lib/data-source";
import { REPOS, TOPICS } from "@/lib/mock-data";
import type { Repo } from "@/lib/types";

export const dynamic = "force-static";
export const revalidate = 3600; // recompute hourly; the pipeline scores daily

type ApiRepo = {
  id: number;
  full_name: string;
  owner: string;
  name: string;
  description: string;
  language: string | null;
  stars: number;
  forks: number;
  stars_today: number;
  score: number;
  rank: number;
  topics: string[];
  html_url: string;
};

function toApi(r: Repo, i: number): ApiRepo {
  return {
    id: i + 1,
    full_name: r.slug,
    owner: r.owner,
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stars,
    forks: r.forks,
    stars_today: r.starsToday,
    score: Math.round(r.score * 100) / 100,
    rank: r.rank,
    topics: r.topics,
    html_url: `https://github.com/${r.slug}`,
  };
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "25", 10) || 25, 1), 100);
  const topic = url.searchParams.get("topic");

  const { repos } = getTrending(100);
  const pool = repos.length > 0 ? repos : REPOS;

  let filtered = pool;
  if (topic) {
    const match = TOPICS.find((t) => t.slug === topic);
    filtered = pool.filter((r) => r.topics.includes(topic));
    if (filtered.length === 0 && match) {
      // topic exists in our catalogue but has no ranked repos yet
      return NextResponse.json(
        { data: [], topic, count: 0, note: "no repos ranked for this topic today" },
        { headers: { "cache-control": "public, s-maxage=3600" } },
      );
    }
  }

  const data = filtered.slice(0, limit).map(toApi);

  return NextResponse.json(
    {
      data,
      count: data.length,
      generated_at: new Date().toISOString(),
      license: "CC0",
    },
    {
      headers: {
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    },
  );
}
