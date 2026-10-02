"use client";

/**
 * Command palette search — ⌘K / Ctrl+K.
 *
 * Client-side over the in-memory catalogue. At this catalogue size a server
 * index is pure overhead; this swaps to a Postgres trigram search the day the
 * catalogue outgrows a few thousand repos.
 */
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { Search, X, CornerDownLeft } from "lucide-react";
import { cn } from "cn";
import { REPOS, TOPICS, LANGUAGES } from "@/lib/mock-data";
import { compact } from "@/lib/format";
import { cssVars } from "@/lib/style";

type Hit =
  | { kind: "repo"; label: string; href: string; sub: string; accent?: never }
  | { kind: "topic"; label: string; href: string; sub: string; accent: string }
  | { kind: "language"; label: string; href: string; sub: string; accent?: never };

const INDEX: Hit[] = [
  ...REPOS.map((r) => ({
    kind: "repo" as const,
    label: r.slug,
    href: `/repo/${r.owner}/${r.name}`,
    sub: `${compact(r.stars)} stars · +${compact(r.starsToday)} today`,
  })),
  ...TOPICS.map((t) => ({
    kind: "topic" as const,
    label: t.name,
    href: `/trending/${t.slug}`,
    sub: `${compact(t.count)} repos`,
    accent: t.accent,
  })),
  ...LANGUAGES.map((l) => ({
    kind: "language" as const,
    label: l.name,
    href: `/languages/${l.slug}`,
    sub: `${compact(l.count)} repos`,
  })),
];

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActive(0);
  }, []);

  // Global ⌘K / Ctrl+K. Escape closes. Slash focuses when not already typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) {
            setQuery("");
            setActive(0);
          }
          return !o;
        });
        return;
      }
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        openPalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, openPalette]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return INDEX.filter((i) => i.kind !== "repo").slice(0, 8);
    }
    return INDEX.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 14);
  }, [query]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) {
        setOpen(false);
        window.location.href = hit.href;
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* backdrop: glass blur, not a flat overlay */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="glass glass-strong relative w-full max-w-[560px] overflow-hidden rounded-2xl shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search repositories, topics, languages…"
            aria-label="Search repositories, topics and languages"
            className="flex-1 bg-transparent py-4 text-[14.5px] outline-none placeholder:text-muted-foreground/60"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close search"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground hover:bg-white/5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {results.length === 0 ? (
          <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">
            No matches for &ldquo;{query}&rdquo;
          </div>
        ) : (
          <ul className="max-h-[50vh] overflow-y-auto py-1.5">
            {results.map((hit, i) => (
              <li key={`${hit.kind}:${hit.href}`}>
                <Link
                  href={hit.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-[13.5px]",
                    i === active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                  )}
                >
                  {hit.kind === "topic" ? (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={cssVars({ "--c": hit.accent })}
                      aria-hidden
                    />
                  ) : (
                    <span className="label-mono !text-[9.5px] w-[52px] shrink-0 text-muted-foreground/70">
                      {hit.kind === "repo" ? "repo" : "lang"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">{hit.label}</span>
                  <span className="tabular shrink-0 text-[11.5px] text-muted-foreground">
                    {hit.sub}
                  </span>
                  {i === active && (
                    <CornerDownLeft className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
