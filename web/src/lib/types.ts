/**
 * Shared types. These mirror the Postgres schema in the plan (section 2/3) and are the
 * contract the ingest pipeline writes into and every page reads from.
 */

export type Repo = {
  id: number;
  owner: string;
  name: string;
  slug: string; // owner/name
  description: string;
  language: string | null;
  stars: number;
  forks: number;
  starsToday: number;
  /** gittrend.io formula: stars_gained² / ln(stars_total + 10) */
  score: number;
  rank: number;
  createdAt: string;
  topics: string[];
  /** Per-topic mosaic hue, resolved server-side from the primary topic. */
  accent: string;
  avatarUrl: string;
  readmePreview?: string | null;
  /** True when the README was empty/unparseable — page gets noindex until real content. */
  thin?: boolean;
  /** Has a GitTiger video (Instagram/YouTube) — featured by the content pipeline. */
  featured?: boolean;
};

export type TopicStat = { slug: string; name: string; count: number; accent: string };

export type LanguageStat = { slug: string; name: string; count: number };

export type Digest = { slug: string; label: string; href: string };

export type SponsorListing = {
  id: string;
  title: string;
  description: string;
  url: string;
  logoUrl: string;
  /** House ads fill the board when unsold — a board never renders empty. */
  house: boolean;
};

export type TrendingRow = {
  repos: Repo[];
  generatedAt: string;
  totalTracked: number;
  activeRanked: number;
};
