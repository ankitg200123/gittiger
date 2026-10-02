import type { Metadata } from "next";

export const SITE_URL = "https://gittiger.com";
export const SITE_NAME = "GitTiger";
export const SITE_DESCRIPTION =
  "Trending AI and developer-tool GitHub repositories, ranked daily by star velocity.";

export const SOCIAL_IMAGE_SIZE = { width: 1200, height: 630 } as const;

type SocialMetadataInput = {
  title: string;
  description: string;
  path: string;
  eyebrow?: string;
};

export function socialImageUrl({ title, description, eyebrow }: SocialMetadataInput): string {
  const query = new URLSearchParams({
    title,
    description,
    ...(eyebrow ? { eyebrow } : {}),
  });

  return `/og?${query.toString()}`;
}

export function socialMetadata({
  title,
  description,
  path,
  eyebrow,
}: SocialMetadataInput): Metadata {
  const image = {
    url: new URL(socialImageUrl({ title, description, path, eyebrow }), SITE_URL).toString(),
    width: SOCIAL_IMAGE_SIZE.width,
    height: SOCIAL_IMAGE_SIZE.height,
    alt: `${title} — ${SITE_NAME}`,
  };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: new URL(path, SITE_URL).toString(),
      siteName: SITE_NAME,
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
