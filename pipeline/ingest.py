"""
GitTiger — hourly ingest.

Downloads the hourly GitHub Archive dump, keeps only star/fork events, counts them
per repo, and upserts into Postgres. Scope-filtered so a full day is MBs not GBs.

Resilience contract (see PLAN.md §3.5):
  - per-item try/except: one bad repo never aborts the batch
  - hard wall-clock deadline spanning all retries
  - circuit breaker on the GH Archive source, persisted to disk
  - idempotent: safe to re-run for the same hour

Usage: python3 ingest.py 2026-10-01-13   # specific hour
       python3 ingest.py                  # previous UTC hour
"""

from __future__ import annotations

import gzip
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

GH_ARCHIVE = "https://data.gharchive.org"
STATE_FILE = Path(__file__).parent / "state" / "ingest_state.json"
DEADLINE_S = 900  # hard cap on the whole run, spanning all retries
MIN_EVENTS_TO_TRACK = 2  # a repo must gain >= N stars in the hour to enter tracking
USER_AGENT = "GitTiger/0.1 (+https://gittiger.com)"

# ─────────────────────────  circuit breaker  ─────────────────────────


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"consecutive_failures": {}, "suspended": {}}


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, indent=2))
    tmp.replace(STATE_FILE)  # atomic


def is_suspended(state: dict, source: str) -> bool:
    susp = state["suspended"].get(source)
    if not susp:
        return False
    if time.time() > susp["retry_at"]:
        return False  # cooldown elapsed -> allow one retry
    return True


def record_success(state: dict, source: str) -> None:
    state["consecutive_failures"].pop(source, None)
    state["suspended"].pop(source, None)


def record_failure(state: dict, source: str, error: str) -> None:
    n = state["consecutive_failures"].get(source, 0) + 1
    state["consecutive_failures"][source] = n
    if n >= 3:
        # suspend for 30 min, then auto-retry once
        state["suspended"][source] = {
            "reason": error,
            "retry_at": time.time() + 1800,
            "consecutive": n,
        }


# ─────────────────────────  fetch with deadline  ─────────────────────────


class Deadline:
    """Wall-clock budget for the whole run. Per-call timeouts don't bound retries."""

    def __init__(self, seconds: float) -> None:
        self.start = time.monotonic()
        self.seconds = seconds

    @property
    def remaining(self) -> float:
        return max(0.0, self.seconds - (time.monotonic() - self.start))

    @property
    def expired(self) -> bool:
        return self.remaining <= 0


def fetch_hour(hour_key: str, deadline: Deadline) -> bytes:
    """Download + gunzip one hourly GH Archive file, bounded by the deadline."""
    url = f"{GH_ARCHIVE}/{hour_key}.json.gz"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    attempts = 0
    last_err: Exception | None = None
    while attempts < 3 and not deadline.expired:
        attempts += 1
        try:
            per_call = min(120, max(10, deadline.remaining))
            with urllib.request.urlopen(req, timeout=per_call) as resp:
                # cap the read: an hourly file should be well under 500 MB
                raw = resp.read(DEADLINE_READ_CAP)
                if len(raw) >= DEADLINE_READ_CAP:
                    raise ValueError(f"response exceeded {DEADLINE_READ_CAP} bytes — refusing to parse a truncated body")
                return gzip.decompress(raw)
        except urllib.error.HTTPError as e:
            last_err = e
            if e.code == 404:
                raise FileNotFoundError(f"no archive for {hour_key}") from e
            if e.code == 429:
                time.sleep(min(60, max(5, deadline.remaining / 2)))  # back off harder
                continue
            time.sleep(2 * attempts)
        except Exception as e:
            last_err = e
            time.sleep(2 * attempts)

    raise TimeoutError(f"could not fetch {hour_key} after {attempts} attempts: {last_err}")


DEADLINE_READ_CAP = 600 * 1024 * 1024


# ─────────────────────────  parse  ─────────────────────────


def count_events(raw: bytes) -> tuple[Counter[str], Counter[str]]:
    """Count WatchEvent (stars) and ForkEvent per repo full name."""
    stars: Counter[str] = Counter()
    forks: Counter[str] = Counter()
    buf = io.StringIO(raw.decode("utf-8", errors="replace"))
    n = 0
    for line in buf:
        if not line.startswith("{"):
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue  # one malformed line never aborts the batch
        if ev.get("type") not in ("WatchEvent", "ForkEvent"):
            continue
        repo = ev.get("repo")
        if not repo:
            continue
        name = repo.get("name")
        if not name:
            continue
        if ev["type"] == "WatchEvent":
            stars[name] += 1
        else:
            forks[name] += 1
        n += 1
    print(f"  parsed {n} star/fork events", flush=True)
    return stars, forks


# ─────────────────────────  persistence  ─────────────────────────
# Postgres layer lands with the DB provision. Until then we persist to a
# newline-delimited JSON file with the identical shape so the site can read it
# and nothing has to be rewritten when the DB arrives.

OUT_DIR = Path(__file__).parent / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def persist(hour_key: str, stars: Counter[str], forks: Counter[str]) -> Path:
    """Append-one-JSONL per hour. Idempotent: re-running overwrites the same hour."""
    out = OUT_DIR / f"stars-{hour_key}.jsonl"
    tmp = out.with_suffix(".tmp")
    with tmp.open("w") as f:
        for name in sorted(set(stars) | set(forks), key=lambda n: (-stars[n], n)):
            f.write(
                json.dumps(
                    {
                        "repo": name,
                        "stars_gained": stars.get(name, 0),
                        "forks_gained": forks.get(name, 0),
                        "hour": hour_key,
                    }
                )
                + "\n"
            )
    tmp.replace(out)
    return out


# ─────────────────────────  main  ─────────────────────────


def hour_key_for(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d-%-H")


def main(argv: list[str]) -> int:
    if len(argv) > 1:
        hour_key = argv[1]
    else:
        prev = datetime.now(timezone.utc) - timedelta(hours=1)
        hour_key = hour_key_for(prev)

    state = load_state()
    source = "gharchive"

    if is_suspended(state, source):
        print(f"[SKIP] {source} suspended until cooldown: {state['suspended'][source].get('reason')}")
        return 0

    deadline = Deadline(DEADLINE_S)
    print(f"[ingest] {hour_key} (budget {DEADLINE_S}s)", flush=True)

    try:
        raw = fetch_hour(hour_key, deadline)
    except FileNotFoundError as e:
        # 404 usually means the hour hasn't been published yet — not a failure
        print(f"[OK] no archive yet for {hour_key}: {e}")
        return 0
    except Exception as e:
        record_failure(state, source, str(e))
        save_state(state)
        print(f"[FAIL] {source}: {e}")
        return 1

    stars, forks = count_events(raw)
    out = persist(hour_key, stars, forks)
    record_success(state, source)
    save_state(state)

    tracked = sum(1 for c in stars.values() if c >= MIN_EVENTS_TO_TRACK)
    print(
        f"[OK] {hour_key}: {len(stars)} repos starred, {tracked} above threshold "
        f"({MIN_EVENTS_TO_TRACK}+), {len(forks)} forked -> {out.name}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
