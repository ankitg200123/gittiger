import Link from "next/link";
import { TrendingUp } from "lucide-react";

export function SiteFooter() {
  return (
      <footer className="mt-16 border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-gradient-to-br from-mosaic-violet to-mosaic-cyan">
                  <TrendingUp className="h-4 w-4 text-black" strokeWidth={2.5} />
                </span>
                <span className="font-semibold text-[14px]">GitTiger</span>
              </div>
              <p className="mt-3 text-[12.5px] text-muted-foreground leading-relaxed">
                Trending AI and developer-tool repositories, ranked daily by star velocity.
              </p>
            </div>
            {[
              {
                h: "Discover",
                links: [
                  ["Rising Stars", "/rising"],
                  ["Hidden Gems", "/hidden-gems"],
                  ["Developers", "/trending/developers"],
                  ["Insights", "/insights"],
                ],
              },
              {
                h: "Browse",
                links: [
                  ["All topics", "/topics"],
                  ["All languages", "/languages"],
                  ["All repositories", "/repositories"],
                  ["Best of all time", "/best"],
                ],
              },
              {
                h: "Resources",
                links: [
                  ["Methodology", "/methodology"],
                  ["Promote your project", "/promote"],
                  ["Advertise", "/advertise"],
                  ["About", "/about"],
                ],
              },
            ].map((col) => (
              <div key={col.h}>
                <span className="label-mono">{col.h}</span>
                <ul className="mt-3 space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <hr className="hairline my-8" />
          <p className="text-[11.5px] text-muted-foreground/70">
            Data from GitHub · CC0 open data
          </p>
        </div>
      </footer>
  );
}
