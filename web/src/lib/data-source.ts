/**
 * Data source bridge.
 *
 * Reads what the Python pipeline writes into ../pipeline/data and maps it to the
 * shape the components expect. If the pipeline data is absent (fresh clone,
 * pipeline not yet run) it falls back to mock data so the site always renders.
 *
 * Nothing upstream changes when the DB lands: only this file gets a new reader.
 */

import path from "node:path";
import fs from "node:fs";
import type { Repo } from "./types";
import { REPOS } from "./mock-data";
import { mosaicFor } from "./mosaic";

const PIPELINE_DATA = path.join(process.cwd(), "..", "pipeline", "data");

type RankingRow = {
  repo: string;
  owner: string;
  name: string;
  stars_total: number;
  stars_today: number;
  score: number;
  rank: number;
  date: string;
};

type MetaRow = {
  full_name: string;
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string | null;
  topics: string[];
  license: string | null;
  html_url: string | null;
  readme_preview: string | null;
  readme_summary: string | null;
  readme_summary_version: number | null;
  metadata_status: string | null;
};

function readJson<T>(file: string): T | null {
  try {
    const p = path.join(PIPELINE_DATA, file);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

function latestRanking(): RankingRow[] | null {
  try {
    // ranking-*.json are named by date, so exclude "featured" from the date sort
    // — ranking-featured.json must never be picked as the latest ranking.
    const files = fs
      .readdirSync(PIPELINE_DATA)
      .filter((f) => f.startsWith("ranking-") && f.endsWith(".json") && f !== "ranking-featured.json")
      .sort();
    if (files.length === 0) return null;
    return JSON.parse(
      fs.readFileSync(path.join(PIPELINE_DATA, files[files.length - 1]), "utf8"),
    );
  } catch {
    return null;
  }
}

function avatarUrl(owner: string): string {
  return `https://avatars.githubusercontent.com/${encodeURIComponent(owner)}?size=120`;
}

export function getTrending(limit = 25): { repos: Repo[]; date: string | null } {
  const ranking = latestRanking();
  if (!ranking || ranking.length === 0) {
    return { repos: [], date: null };
  }

  const meta = readJson<Record<string, MetaRow>>("metadata.json") ?? {};

  const repos: Repo[] = ranking.slice(0, limit).map((row) => {
    const m = meta[row.repo];
    const topics = m?.topics?.length ? m.topics : [];
    const primary = topics[0] ?? row.name;
    return {
      id: 0,
      owner: row.owner,
      name: row.name,
      slug: row.repo,
      description: m?.description || `${row.repo} — trending on GitHub.`,
      language: m?.language ?? null,
      stars: m?.stargazers_count ?? row.stars_total,
      forks: m?.forks_count ?? 0,
      starsToday: row.stars_today,
      score: row.score,
      rank: row.rank,
      createdAt: m?.created_at ?? new Date().toISOString(),
      topics,
      accent: mosaicFor(primary),
      avatarUrl: avatarUrl(row.owner),
      readmePreview: m?.readme_preview ?? null,
      thin: !m?.readme_preview,
    };
  });

  return { repos, date: ranking[0]?.date ?? null };
}

export function pipelineAvailable(): boolean {
  try {
    return latestRanking() !== null;
  } catch {
    return false;
  }
}

/**
 * Repos featured by the content pipeline (Instagram/YouTube videos). The
 * pipeline's sync_content.py writes data/featured.json. A repo here is shown on
 * the site even if it never appeared in the daily star-velocity ranking —
 * having a video is itself the editorial signal.
 */
export function getFeaturedRepos(): Set<string> {
  // normalise to lowercase — featured.json keeps GitHub's original casing
  // (e.g. "MemPalace/mempalace") but lookups compare lowercased slugs.
  return new Set(getFeaturedSlugs().map((s) => s.toLowerCase()));
}

/** Original-cased slugs from featured.json, for URL generation. */
export function getFeaturedSlugs(): string[] {
  const featured = readJson<{ repos?: string[] }>("featured.json");
  return featured?.repos ?? [];
}

/**
 * Look up a single repo by owner/name across the live pipeline data first,
 * then mock data. Returns null when neither has it.
 */
export function getRepo(owner: string, name: string): Repo | null {
  const o = owner.toLowerCase();
  const n = name.toLowerCase();
  const slug = `${owner}/${name}`;

  // 1. live pipeline data (metadata + ranking)
  // metadata.json is keyed by full_name; some entries (not_found sentinels)
  // carry no full_name field, so the key is the only reliable identifier.
  const meta = readJson<Record<string, MetaRow>>("metadata.json") ?? {};
  const hit = Object.entries(meta).find(
    ([key, m]) =>
      key.toLowerCase() === slug.toLowerCase() &&
      (m as MetaRow | null)?.metadata_status !== "not_found",
  );
  const hitMeta = hit ? (hit[1] as MetaRow) : null;
  const ranking = latestRanking() ?? [];
  const featured = getFeaturedRepos();
  const row = ranking.find((r) => r.repo.toLowerCase() === slug.toLowerCase());
  if (hitMeta || row || featured.has(slug.toLowerCase())) {
    const r = row;
    const m = hitMeta;
    const topics = m?.topics?.length ? m.topics : [];
    const primary = topics[0] ?? name;
    return {
      id: 0,
      owner: m?.owner ?? owner,
      name: m?.name ?? name,
      slug: m?.full_name ?? `${owner}/${name}`,
      description: m?.description || (r ? `${r.repo} — trending on GitHub.` : `${slug} — featured on GitTiger.`),
      language: m?.language ?? null,
      stars: m?.stargazers_count ?? r?.stars_total ?? 0,
      forks: m?.forks_count ?? 0,
      starsToday: r?.stars_today ?? 0,
      score: r?.score ?? 0,
      rank: r?.rank ?? 0,
      createdAt: m?.created_at ?? new Date().toISOString(),
      topics,
      accent: mosaicFor(primary),
      avatarUrl: avatarUrl(m?.owner ?? owner),
      readmePreview: m?.readme_summary ?? m?.readme_preview ?? null,
      thin: !m?.readme_summary && !m?.readme_preview,
      featured: true,
    };
  }

  // 2. mock data
  const mock = REPOS.find((x) => x.owner.toLowerCase() === o && x.name.toLowerCase() === n) ?? null;
  if (mock) {
    if (featured.has(slug.toLowerCase())) mock.featured = true;
    return mock;
  }
  return null;
}

/**
 * All repos currently available to the site — pipeline repos plus mock repos.
 * Used for generateStaticParams so every repo the UI can link to prerenders.
 */
export function getAllRepos(): Repo[] {
  const seen = new Set<string>();
  const out: Repo[] = [];
  const featured = getFeaturedRepos();

  const ranking = latestRanking() ?? [];
  const meta = readJson<Record<string, MetaRow>>("metadata.json") ?? {};
  for (const row of ranking) {
    const key = row.repo.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const m = meta[row.repo];
    const topics = m?.topics?.length ? m.topics : [];
    const primary = topics[0] ?? row.name;
    out.push({
      id: 0,
      owner: row.owner,
      name: row.name,
      slug: row.repo,
      description: m?.description || `${row.repo} — trending on GitHub.`,
      language: m?.language ?? null,
      stars: m?.stargazers_count ?? row.stars_total,
      forks: m?.forks_count ?? 0,
      starsToday: row.stars_today,
      score: row.score,
      rank: row.rank,
      createdAt: m?.created_at ?? new Date().toISOString(),
      topics,
      accent: mosaicFor(primary),
      avatarUrl: avatarUrl(row.owner),
      readmePreview: m?.readme_summary ?? m?.readme_preview ?? null,
      thin: !m?.readme_summary && !m?.readme_preview,
      featured: featured.has(row.repo),
    });
  }

  // Repos with a video that never appeared in the ranking are still catalogued.
  for (const slug of getFeaturedSlugs()) {
    const key = slug.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const owner = slug.split("/")[0];
    const name = slug.split("/").slice(1).join("/");
    const m = meta[slug];
    const topics = m?.topics?.length ? m.topics : [];
    const primary = topics[0] ?? name;
    out.push({
      id: 0,
      owner: m?.owner ?? owner,
      name: m?.name ?? name,
      slug: m?.full_name ?? slug,
      description: m?.description || `${slug} — featured on GitTiger.`,
      language: m?.language ?? null,
      stars: m?.stargazers_count ?? 0,
      forks: m?.forks_count ?? 0,
      starsToday: 0,
      score: 0,
      rank: 0,
      createdAt: m?.created_at ?? new Date().toISOString(),
      topics,
      accent: mosaicFor(primary),
      avatarUrl: avatarUrl(m?.owner ?? owner),
      readmePreview: m?.readme_summary ?? m?.readme_preview ?? null,
      thin: !m?.readme_summary && !m?.readme_preview,
      featured: true,
    });
  }

  for (const r of REPOS) {
    const key = `${r.owner}/${r.name}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }
  return out;
}
