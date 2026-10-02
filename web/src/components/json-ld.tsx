import type { Repo } from "@/lib/types";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type JsonLdProps = { data: unknown };

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description:
          "Trending AI and developer-tool GitHub repositories, ranked daily by star velocity.",
        inLanguage: "en",
      }}
    />
  );
}

export function CollectionJsonLd({
  name,
  description,
  path,
  repos,
}: {
  name: string;
  description: string;
  path: string;
  repos: Repo[];
}) {
  const url = new URL(path, SITE_URL).toString();
  const repositoryUrl = (repo: Repo) =>
    new URL(`/repo/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`, SITE_URL).toString();

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name,
        description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: repos.length,
          itemListElement: repos.map((repo, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "SoftwareSourceCode",
              name: repo.name,
              alternateName: repo.slug,
              url: repositoryUrl(repo),
              codeRepository: `https://github.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`,
              description: repo.description,
              ...(repo.language ? { programmingLanguage: repo.language } : {}),
            },
          })),
        },
      }}
    />
  );
}
