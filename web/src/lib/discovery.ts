import { REPOS } from "@/lib/mock-data";
import type { Repo } from "@/lib/types";

export const REPOSITORY_LETTERS = [..."abcdefghijklmnopqrstuvwxyz", ..."0123456789", "0-9"];
export const REPOSITORY_GROUPS = [..."abcdefghijklmnopqrstuvwxyz", "0-9"];

export const DEVELOPERS = Object.values(
  REPOS.reduce<Record<string, { owner: string; starsGained: number; repos: Repo[] }>>(
    (developers, repo) => {
      const developer = developers[repo.owner] ?? {
        owner: repo.owner,
        starsGained: 0,
        repos: [],
      };
      developer.starsGained += repo.starsToday;
      developer.repos.push(repo);
      developers[repo.owner] = developer;
      return developers;
    },
    {},
  ),
).sort((a, b) => b.starsGained - a.starsGained || a.owner.localeCompare(b.owner));

export function reposForInitial(initial: string): Repo[] {
  return REPOS.filter((repo) => {
    const owner = repo.owner.toLowerCase();
    return initial === "0-9" ? /^[0-9]/.test(owner) : owner.startsWith(initial);
  });
}

export function reposForOwner(owner: string): Repo[] {
  return REPOS.filter((repo) => repo.owner.toLowerCase() === owner.toLowerCase());
}

export function tagCounts(): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const repo of REPOS) {
    for (const tag of new Set(repo.topics)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export const COMPARE_PAIRS: [Repo, Repo][] = [
  [REPOS[0], REPOS[1]],
  [REPOS[2], REPOS[3]],
  [REPOS[4], REPOS[5]],
];

export function compareHref(a: Repo, b: Repo): string {
  return `/compare/${encodeURIComponent(a.owner)}/${encodeURIComponent(a.name)}/vs/${encodeURIComponent(b.owner)}/${encodeURIComponent(b.name)}`;
}

/** A stable, week-seeded selection and ordering for the digest sample data. */
export function reposForWeek(week: string, limit = 8): Repo[] {
  return REPOS.map((repo) => {
    let hash = 2166136261;
    const key = `${week}:${repo.slug}`;
    for (let i = 0; i < key.length; i++) {
      hash = Math.imul(hash ^ key.charCodeAt(i), 16777619) >>> 0;
    }
    return { repo, hash };
  })
    .sort((a, b) => a.hash - b.hash)
    .slice(0, limit)
    .map(({ repo }) => repo);
}

export function isValidIsoWeek(value: string): boolean {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (year < 1 || week < 1 || week > 53) return false;

  const jan4 = new Date(0);
  jan4.setUTCFullYear(year, 0, 4);
  jan4.setUTCHours(0, 0, 0, 0);
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7));
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + (week - 1) * 7 + 3);
  return thursday.getUTCFullYear() === year;
}
