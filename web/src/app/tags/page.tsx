import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SiteFooter } from "@/components/site-footer";
import { cssVars } from "@/lib/style";
import { tagCounts } from "@/lib/discovery";
import { mosaicFor } from "@/lib/mosaic";
import { socialMetadata } from "@/lib/seo";

export const metadata = socialMetadata({
  title: "Browse Repository Tags",
  description: "Explore repository topics by sample coverage.",
  path: "/tags",
  eyebrow: "REPOSITORY TAG INDEX",
});

export default function TagsPage() {
  const tags = tagCounts();
  return (
    <>
      <PageShell
        eyebrow="Browse · Tags"
        title="Repository tags"
        description="Explore every unique repository topic in the current sample, ordered by how many repositories use it."
      >
        <div className="flex flex-wrap gap-2.5">
          {tags.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="chip transition-transform duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
              style={cssVars({ "--chip-color": mosaicFor(tag) })}
            >
              <span>{tag}</span>
              <span className="tabular opacity-65">{count}</span>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-[11.5px] text-muted-foreground/75">Each repository contributes at most once per tag.</p>
      </PageShell>
      <SiteFooter />
    </>
  );
}
