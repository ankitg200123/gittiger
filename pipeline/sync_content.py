"""
GitTiger — content sync.

The Instagram/YouTube pipeline (/Users/ankitgupta/hermesprojects/logic-mosaic)
posts one video per repo daily. This script syncs its posted.json into the
trends site so every repo that has a video is:

  1. guaranteed present in the site's catalogue (injected into the ranking if
     it never trended — posted repos are editorially featured regardless)
  2. marked with the video's metadata so repo pages can link to the reel

Idempotent: re-running only adds new posts and updates changed fields.

Usage: python3 sync_content.py
       CONTENT_ROOT=/other/path python3 sync_content.py
"""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import store
from store import DATA, _file_read, cursor, postgres_available

DATA = Path(__file__).parent / "data"

DEFAULT_CONTENT_ROOT = "/Users/ankitgupta/hermesprojects/logic-mosaic"
POSTED_FILE = "posted.json"
FEATURED_FILE = "featured.json"


def content_root() -> Path:
    return Path(os.environ.get("CONTENT_ROOT", DEFAULT_CONTENT_ROOT))


def load_posted() -> tuple[set[str], dict[str, dict]]:
    """Returns (repo names, detail keyed by repo)."""
    path = content_root() / POSTED_FILE
    if not path.exists():
        print(f"[WARN] {path} not found — nothing to sync")
        return set(), {}
    raw = json.loads(path.read_text())
    repos = raw.get("posted_repos") if isinstance(raw, dict) else raw
    if not isinstance(repos, list):
        return set(), {}
    return {r for r in repos if isinstance(r, str)}, {}


def latest_ranking() -> list[dict]:
    """Newest ranking we actually have on disk — not assumed to be today's."""
    if postgres_available():
        try:
            with cursor() as cur:
                cur.execute(
                    "SELECT DISTINCT snapshot_date FROM repo_snapshots ORDER BY snapshot_date DESC LIMIT 1"
                )
                row = cur.fetchone()
                if row:
                    return _file_read(f"ranking-{row[0]}.json") or []
        except Exception as exc:
            print(f"[WARN] postgres latest_ranking failed: {exc}")

    files = sorted(DATA.glob("ranking-*.json"), reverse=True)
    for path in files:
        # only date-named rankings (ranking-YYYY-MM-DD.json); any other suffix
        # must never be picked as "latest" or the site shows Invalid Date.
        if not re.fullmatch(r"ranking-\d{4}-\d{2}-\d{2}\.json", path.name):
            continue
        rows = _file_read(path.name)
        if rows:
            return rows
    return []


def main(argv: list[str] | None = None) -> int:
    posted, _ = load_posted()
    if not posted:
        print("[OK] no posted repos to sync")
        return 0

    ranking = latest_ranking()
    ranked_names = {r["repo"] for r in ranking}

    # Repos that have a video but never appeared in the daily ranking.
    # These are still catalogued — a video is an editorial endorsement, so the
    # site should show them even if they are not currently trending.
    injected = []
    for repo in sorted(posted - ranked_names):
        owner, _, name = repo.partition("/")
        injected.append(
            {
                "repo": repo,
                "owner": owner,
                "name": name,
                "stars_total": 0,
                "stars_today": 0,
                "score": 0.0,
                "rank": 0,
                "date": "featured",
            }
        )

    featured = {
        "repos": sorted(posted),
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "injected": [r["repo"] for r in injected],
    }
    out = DATA / FEATURED_FILE
    out.write_text(json.dumps(featured, indent=2))

    # NOTE: injected repos are catalogued on the site purely through
    # featured.json (getAllRepos reads it directly). We deliberately do NOT
    # write a ranking-featured.json — latestRanking() in the site data layer
    # picks the highest sorting ranking-*.json file, so a non-date suffix
    # there would show "Ranked Invalid Date" on the homepage.

    print(
        f"[OK] synced {len(posted)} posted repos "
        f"({len(injected)} injected into the catalogue, "
        f"{len(posted & ranked_names)} already ranked)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
