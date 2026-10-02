"use client";

import Link from "next/link";
import { Search, TrendingUp } from "lucide-react";
import { cn } from "cn";

const NAV = [
  { href: "/trending/ai-agent", label: "Topics" },
  { href: "/languages", label: "Languages" },
  { href: "/rising", label: "Rising" },
  { href: "/hidden-gems", label: "Hidden Gems" },
  { href: "/insights", label: "Insights" },
  { href: "/weekly", label: "Digests" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50">
      <div className="glass border-b border-white/10 rounded-none px-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6">
          {/* Wordmark — mono mark, no emoji */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-gradient-to-br from-mosaic-violet to-mosaic-cyan">
              <TrendingUp className="h-4.5 w-4.5 text-black" strokeWidth={2.5} />
            </span>
            <span className="font-semibold tracking-tight text-[15px] hidden sm:block">
              GitTiger
              <span className="text-muted-foreground font-normal"> </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13.5px] text-muted-foreground",
                  "transition-colors duration-200 hover:text-foreground hover:bg-white/5",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                // The palette listens for ⌘K; synthesising it opens the palette
                // without lifting state into the layout.
                window.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    key: "k",
                    metaKey: true,
                    bubbles: true,
                  }),
                );
              }}
              className={cn(
                "hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03]",
                "px-3 py-1.5 text-[13px] text-muted-foreground",
                "transition-colors duration-200 hover:border-white/20 hover:text-foreground",
                "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
              )}
              aria-label="Search repositories, topics and tags"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Search repos, topics…</span>
              <kbd className="tabular ml-1 rounded border border-white/10 bg-white/5 px-1.5 text-[10px]">
                ⌘K
              </kbd>
            </button>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-muted-foreground transition-colors duration-200 hover:text-foreground hover:border-white/20"
              aria-label="GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 1.7 2.7 1.2 3.3.9.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.1.8.8 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
