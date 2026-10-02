/**
 * Mock data — stands in for the Postgres read layer until the ingest pipeline lands.
 * Shape is identical to what the pipeline will return, so swapping is a data-source
 * change only, not a component rewrite.
 */
import type { Repo, TopicStat, LanguageStat, Digest, SponsorListing } from "./types";
import { mosaicFor, MOSAIC } from "./mosaic";

const AV = "https://avatars.githubusercontent.com/u";

export const TOPICS: TopicStat[] = [
  { slug: "ai-agent", name: "AI Agent", count: 3435 },
  { slug: "ai-coding-assistant", name: "AI Coding Assistant", count: 2188 },
  { slug: "mcp", name: "MCP", count: 1922 },
  { slug: "rag", name: "RAG", count: 1640 },
  { slug: "local-llm", name: "Local LLM", count: 1430 },
  { slug: "ai-video-generation", name: "AI Video Generation", count: 1207 },
  { slug: "vector-database", name: "Vector Database", count: 1095 },
  { slug: "text-to-speech", name: "Text to Speech", count: 988 },
  { slug: "computer-vision", name: "Computer Vision", count: 941 },
  { slug: "workflow-automation", name: "Workflow Automation", count: 877 },
  { slug: "self-hosted", name: "Self-Hosted", count: 5585 },
  { slug: "ui-components", name: "UI Components", count: 5664 },
].map((t) => ({ ...t, accent: mosaicFor(t.slug) }));

export const LANGUAGES: LanguageStat[] = [
  { slug: "python", name: "Python", count: 12840 },
  { slug: "typescript", name: "TypeScript", count: 9210 },
  { slug: "javascript", name: "JavaScript", count: 7715 },
  { slug: "go", name: "Go", count: 4012 },
  { slug: "rust", name: "Rust", count: 3110 },
  { slug: "java", name: "Java", count: 2664 },
  { slug: "cpp", name: "C++", count: 1988 },
  { slug: "swift", name: "Swift", count: 1204 },
];

export const WEEKLY: Digest[] = Array.from({ length: 8 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (i + 1) * 7);
  const iso = d.toISOString();
  const week = isoDateToISOWeek(iso);
  return {
    slug: week,
    label: `Week ${week.split("-W")[1]}, ${week.split("-")[0]}`,
    href: `/weekly/${week}`,
  };
});

export const MONTHLY: Digest[] = Array.from({ length: 5 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return {
    slug: d.toISOString().slice(0, 7),
    label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    href: `/monthly/${d.toISOString().slice(0, 7)}`,
  };
});

/** ISO week, e.g. 2026-W37 */
function isoDateToISOWeek(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  const fd = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fd + 3);
  const week =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

type Seed = {
  owner: string;
  name: string;
  desc: string;
  lang: string;
  stars: number;
  today: number;
  topics: string[];
  uid: number;
  ageDays: number;
};

const SEEDS: Seed[] = [
  { owner: "browser-use", name: "jev-ultrafast", desc: "i. am. speed. A lightweight Python wrapper that turns a Chromium instance into a blazing-fast headless browser.", lang: "Python", stars: 12130, today: 3300, topics: ["python", "automation", "webdriver"], uid: 1, ageDays: 5 },
  { owner: "cloudflare", name: "security-audit-skill", desc: "A coding-agent skill for multi-phase security audits with independently verified, machine-readable findings.", lang: "JavaScript", stars: 18085, today: 3000, topics: ["security-audit", "coding-agent"], uid: 2, ageDays: 40 },
  { owner: "tamaratran", name: "fast-jev-compaction", desc: "Claude Code plugin that replaces the compaction summary with scored decisions.", lang: "TypeScript", stars: 5245, today: 2800, topics: ["prompt-caching", "code-optimization"], uid: 3, ageDays: 22 },
  { owner: "alibaba", name: "open-code-review", desc: "Hybrid architecture code review: deterministic pipelines plus an LLM agent, with precise line-level comments.", lang: "Go", stars: 37300, today: 1800, topics: ["code-review", "llm-agent", "vulnerability-detection"], uid: 4, ageDays: 60 },
  { owner: "latent-spaces", name: "brag", desc: "You built it. Now brag. Turn the project you just created into a short, shareable launch video with one command.", lang: "Python", stars: 5700, today: 1600, topics: ["launch-video", "cli-tool", "automation"], uid: 5, ageDays: 12 },
  { owner: "eternity4719", name: "HowToLiveBetter", desc: "An evidence-based lifestyle guide ranked by cost-benefit, citing only journal papers and official documents.", lang: "HTML", stars: 8880, today: 1500, topics: ["evidence-based", "cost-benefit"], uid: 6, ageDays: 90 },
  { owner: "hypit-ai", name: "hypit", desc: "Clone any viral video with AI agents.", lang: "TypeScript", stars: 10700, today: 1200, topics: ["video-automation", "text-to-video", "ffmpeg"], uid: 7, ageDays: 30 },
  { owner: "Tencent", name: "BrowserSkill", desc: "Let AI agents use your real, logged-in browser without interrupting your work.", lang: "TypeScript", stars: 5300, today: 1100, topics: ["browser-automation", "ai-agent-extension"], uid: 8, ageDays: 18 },
  { owner: "deepseek-ai", name: "deepseek-harness", desc: "Everything is a Plugin.", lang: "TypeScript", stars: 229800, today: 1100, topics: ["plugin-architecture", "modular-framework"], uid: 9, ageDays: 120 },
  { owner: "bendlang", name: "bend", desc: "A fast language that blocks AI mistakes via proof.", lang: "TypeScript", stars: 18700, today: 900, topics: ["compiler", "language"], uid: 10, ageDays: 200 },
  { owner: "modelcontextprotocol", name: "spec", desc: "The open specification for connecting AI assistants to data sources and tools.", lang: "TypeScript", stars: 9400, today: 820, topics: ["mcp", "protocol", "ai-agent"], uid: 11, ageDays: 150 },
  { owner: "vercel-labs", name: "zerolang", desc: "A minimal runtime that compiles to WebAssembly in one pass.", lang: "Rust", stars: 6100, today: 740, topics: ["wasm", "runtime", "compiler"], uid: 12, ageDays: 9 },
];

/** Deterministic pseudo-random sparkline from a seed. */
function sparkline(seed: number, len = 24): number[] {
  const out: number[] = [];
  let x = seed * 9301 + 49297;
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280;
    out.push(0.25 + (x / 233280) * 0.75);
  }
  return out;
}

function toRepo(s: Seed, i: number): Repo {
  const score = (s.today ** 2) / Math.log(s.stars + 10);
  const created = new Date();
  created.setDate(created.getDate() - s.ageDays);
  return {
    id: i + 1,
    owner: s.owner,
    name: s.name,
    slug: `${s.owner}/${s.name}`,
    description: s.desc,
    language: s.lang,
    stars: s.stars,
    forks: Math.round(s.stars * 0.06),
    starsToday: s.today,
    score,
    rank: i + 1,
    createdAt: created.toISOString(),
    topics: s.topics,
    accent: mosaicFor(s.topics[0]),
    avatarUrl: `${AV}/${s.uid + 1000}?size=120`,
  };
}

export const REPOS: Repo[] = SEEDS.map(toRepo).sort((a, b) => b.score - a.score);
REPOS.forEach((r, i) => (r.rank = i + 1));

/** 30-day star history for charting — synthetic until the snapshot table exists. */
export function starHistory(slug: string, len = 30): number[] {
  const repo = REPOS.find((r) => r.slug === slug) ?? REPOS[0];
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const daily = Math.max(1, Math.round(repo.stars / 90));
  const out: number[] = [];
  let cur = Math.max(repo.stars - daily * len, 1);
  for (let i = 0; i < len; i++) {
    h = (h * 9301 + 49297) % 233280;
    cur += Math.round(daily * (0.5 + (h / 233280)));
    out.push(cur);
  }
  out[len - 1] = repo.stars;
  return out;
}

export { sparkline, MOSAIC };

export const SPONSORS: SponsorListing[] = [
  {
    id: "house-1",
    title: "GitTiger",
    description: "Daily trending AI & dev-tool repos, ranked by star velocity.",
    url: "/promote",
    logoUrl: "/logo-mark.svg",
    house: true,
  },
];

export const SITE = {
  name: "GitTiger",
  totalTracked: 47_200_000,
  activeRanked: 45_000,
};
