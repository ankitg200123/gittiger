import type { MetadataRoute } from "next";
import { COMPARE_PAIRS, REPOSITORY_LETTERS, DEVELOPERS, tagCounts } from "@/lib/discovery";
import { LANGUAGES, MONTHLY, REPOS, TOPICS, WEEKLY } from "@/lib/mock-data";
import { SITE_URL } from "@/lib/seo";

const STATIC_ROUTES = [
  "/",
  "/topics",
  "/languages",
  "/rising",
  "/hidden-gems",
  "/insights",
  "/weekly",
  "/monthly",
  "/compare",
  "/best",
  "/tags",
  "/repositories",
  "/trending/developers",
  "/about",
  "/methodology",
  "/promote",
  "/advertise",
  "/contact",
  "/privacy",
  "/terms",
  "/llms.txt",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority,
  });
  const repoPath = (owner: string, name: string) =>
    `/repo/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;

  return [
    ...STATIC_ROUTES.map((path) => entry(path, path === "/" ? 1 : 0.7)),
    ...REPOS.map((repo) => entry(repoPath(repo.owner, repo.name), 0.6)),
    ...TOPICS.flatMap((topic) => [
      entry(`/trending/${encodeURIComponent(topic.slug)}`, 0.7),
      entry(`/best/${encodeURIComponent(topic.slug)}`, 0.6),
    ]),
    ...LANGUAGES.map((language) =>
      entry(`/languages/${encodeURIComponent(language.slug)}`, 0.7),
    ),
    ...WEEKLY.map((digest) => entry(digest.href, 0.5)),
    ...MONTHLY.map((digest) => entry(digest.href, 0.5)),
    ...tagCounts().map(({ tag }) => entry(`/tags/${encodeURIComponent(tag)}`, 0.5)),
    ...REPOSITORY_LETTERS.map((letter) => entry(`/repositories/${letter}`, 0.4)),
    ...DEVELOPERS.map((developer) =>
      entry(`/user/${encodeURIComponent(developer.owner)}`, 0.5),
    ),
    ...COMPARE_PAIRS.map(([a, b]) =>
      entry(
        `/compare/${encodeURIComponent(a.owner)}/${encodeURIComponent(a.name)}` +
          `/vs/${encodeURIComponent(b.owner)}/${encodeURIComponent(b.name)}`,
        0.5,
      ),
    ),
  ];
}
