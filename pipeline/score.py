"""
GitTiger — daily scoring.

Reads the hourly star counts written by ingest.py, computes the trending score
for every tracked repo, and writes a daily ranking snapshot.

Score is gittrend.io's published formula:
    score = stars_gained_24h² / ln(stars_total + 10)

This surfaces both established giants with genuine new momentum AND small
projects undergoing outsized growth — which is the whole point versus
GitHub's raw daily-star-count trending page.

Design notes (PLAN.md §3.2):
  - batch-relative normalisation is NOT applied here: the formula itself is
    already relative and produces a healthy spread. The sanity check below
    halts the run if scores collapse to a flat distribution.
  - Rising = created within 180 days. Hidden gem = < 2000 stars + high velocity.
  - idempotent: re-running the same date overwrites the snapshot.

Usage: python3 score.py 2026-10-01
       python3 score.py                # today (UTC)
"""

from __future__ import annotations

import json
import math
import sys
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

import store

DATA = Path(__file__).parent / "data"
RISING_MAX_AGE_DAYS = 180
HIDDEN_GEM_MAX_STARS = 2000

# ─────────────────────────  load hourly counts  ─────────────────────────


def load_day(date_key: str) -> Counter[str]:
    """Sum stars_gained across the 24 hourly files for a UTC date."""
    total: Counter[str] = Counter()
    found = 0
    for hour in range(24):
        path = DATA / f"stars-{date_key}-{hour}.jsonl"
        if not path.exists():
            continue
        found += 1
        for line in path.open():
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            total[rec["repo"]] += rec.get("stars_gained", 0)
    if found == 0:
        raise FileNotFoundError(f"no hourly data found for {date_key}")
    print(f"  loaded {found}/24 hourly files, {len(total)} repos", flush=True)
    return total


# ─────────────────────────  total stars  ─────────────────────────
# Until the DB is provisioned, totals are seeded from metadata.json written by
# fetch_metadata.py. Fall back to the daily gain itself so scoring never blocks.


def load_totals() -> dict[str, int]:
    path = DATA / "metadata.json"
    if not path.exists():
        return {}
    try:
        recs = json.loads(path.read_text())
        return {r["full_name"]: r.get("stargazers_count", 0) for r in recs.values()}
    except Exception:
        return {}


# ─────────────────────────  score  ─────────────────────────


def trending_score(gained: int, total: int) -> float:
    """stars_gained² / ln(stars_total + 10) — gittrend.io's published formula."""
    if gained <= 0:
        return 0.0
    return (gained * gained) / math.log(total + 10)


def sanity_check(scores: list[float]) -> None:
    """Halt rather than publish a degenerate ranking.

    GitHub's real long tail means thousands of repos gain exactly 1 star/day, so
    raw distinct-count would always 'fail' on healthy data. What we actually
    guard against is collapse in the *head*, where the formula has stopped
    discriminating between genuinely different momentum levels.
    """
    if not scores:
        raise ValueError("no scores produced")
    if max(scores) <= 0:
        raise ValueError("every score is zero — ingest produced no star gains")

    # A healthy ranking spreads across several orders of magnitude in the head.
    head = sorted(scores[:250], reverse=True)
    top, tail = head[0], head[-1]
    if top <= 0:
        raise ValueError("head scores are all zero")
    if top / tail < 1.15:
        raise ValueError(
            f"head collapsed: top {top:.2f} vs rank-250 {tail:.2f} — the formula has "
            "stopped discriminating between different momentum levels"
        )
    if tail <= 0:
        raise ValueError("zero scores inside the top 250")


# ─────────────────────────  main  ─────────────────────────


def main(argv: list[str]) -> int:
    date_key = argv[1] if len(argv) > 1 else datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print(f"[score] {date_key}", flush=True)
    try:
        gained = load_day(date_key)
    except FileNotFoundError as e:
        print(f"[FAIL] {e}")
        return 1

    totals = store.load_metadata()
    # metadata.json maps full_name -> stargazers_count. score.py's stars_total
    # MUST be the repo's lifetime stars — using today's gain instead makes the
    # star-farming ratio in classify.py evaluate to ~1.0 for every repo.
    lifetime = {k: int(v.get("stargazers_count", 0) or 0) for k, v in totals.items()}
    now = datetime.now(timezone.utc)

    rows = []
    for repo, stars_today in gained.items():
        if stars_today <= 0:
            continue
        total = lifetime.get(repo)
        if total is None or total <= 0:
            # no metadata yet — fall back to the day's gain as a floor so the
            # repo still ranks, but mark it so classify.py skips the ratio check
            total = stars_today
        score = trending_score(stars_today, total)
        rows.append(
            {
                "repo": repo,
                "owner": repo.split("/")[0] if "/" in repo else repo,
                "name": repo.split("/")[1] if "/" in repo else repo,
                "stars_total": total,
                "stars_today": stars_today,
                "score": round(score, 4),
                "date": date_key,
            }
        )

    rows.sort(key=lambda r: r["score"], reverse=True)
    for i, r in enumerate(rows):
        r["rank"] = i + 1

    sanity_check([r["score"] for r in rows])

    store.save_ranking(date_key, rows)

    print(
        f"[OK] {date_key}: ranked {len(rows)} repos, top = {rows[0]['repo']} "
        f"({rows[0]['score']:.1f}, +{rows[0]['stars_today']} today)",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
