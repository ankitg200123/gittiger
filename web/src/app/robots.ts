import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/llms.txt"],
      disallow: ["/api/", "/admin/", "/go/", "/promote/ticket/"],
    },
    sitemap: "https://gittiger.com/sitemap.xml",
  };
}
