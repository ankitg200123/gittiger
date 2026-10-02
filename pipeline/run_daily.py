"""
GitTiger — daily DAG runner.

One entry point for the whole daily cycle, designed for a systemd timer or cron.
Runs the stages in dependency order, records each run for observability, and
never lets one stage's failure skip later independent stages.

    ingest (yesterday, all 24 hours)
      -> score (yesterday)
           -> fetch_metadata
                -> classify (rules-based, unresolved repos need review)
                     -> enrich (grounded LLM write-ups)
                          -> digests (TODO)
                          -> sitemaps / ISR revalidation

Usage: python3 run_daily.py [--date 2026-10-01]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).parent
RUNS_FILE = HERE / "data" / "pipeline_runs.jsonl"
RUNS_FILE.parent.mkdir(parents=True, exist_ok=True)


def log(msg: str) -> None:
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    print(f"[{stamp}] {msg}", flush=True)


def record(job: str, argument: str, status: str, detail: str, rows: int | None, started: float) -> None:
    """Append-only run ledger. Mirrors the pipeline_runs table for the pre-DB phase."""
    rec = {
        "job": job,
        "argument": argument,
        "status": status,
        "detail": detail[:500],
        "rows_affected": rows,
        "started_at": datetime.fromtimestamp(started, timezone.utc).isoformat(),
        "finished_at": datetime.now(timezone.utc).isoformat(),
    }
    with RUNS_FILE.open("a") as f:
        f.write(json.dumps(rec) + "\n")


def run(script: str, args: list[str], job: str, argument: str) -> int:
    """Run one stage. Returns the exit code; never raises."""
    started = time.time()
    cmd = [sys.executable, str(HERE / script), *args]
    log(f"→ {job} {' '.join(args)}")
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
    except subprocess.TimeoutExpired:
        record(job, argument, "failed", "timeout after 3600s", None, started)
        log(f"✗ {job} timed out")
        return 124

    detail = (proc.stdout + proc.stderr).strip()
    tail = detail.splitlines()[-1] if detail else ""
    status = "ok" if proc.returncode == 0 else "failed"
    rows = None
    if proc.returncode == 0 and "ranked" in tail:
        # "[OK] 2026-10-01: ranked 5377 repos, ..." -> 5377
        try:
            rows = int(tail.split("ranked ")[1].split(" ")[0])
        except (IndexError, ValueError):
            pass
    elif proc.returncode == 0 and job == "enrich" and "generated " in tail:
        # "[OK] 2026-10-01: generated 12, needs human review ..." -> 12
        try:
            rows = int(tail.split("generated ", 1)[1].split(",", 1)[0])
        except (IndexError, ValueError):
            pass

    record(job, argument, status, tail, rows, started)
    if proc.returncode == 0:
        log(f"✓ {job}: {tail}")
    else:
        log(f"✗ {job} ({proc.returncode}): {tail}")
    return proc.returncode


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", help="UTC date to process (defaults to yesterday)")
    args = ap.parse_args(argv[1:])

    date_key = args.date or (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    log(f"=== daily run for {date_key} ===")

    failures = 0

    # 1. Ingest all 24 hourly files. Missing hours (archive not published yet)
    #    return 0 individually, so this is safe to run early.
    ingested = 0
    for hour in range(24):
        rc = run("ingest.py", [f"{date_key}-{hour}"], "ingest", f"{date_key}-{hour}")
        if rc == 0:
            ingested += 1
        elif rc != 124:
            failures += 1
    log(f"ingested {ingested}/24 hours")

    # 2. Score. A failed score blocks metadata (nothing to enrich).
    rc = run("score.py", [date_key], "score", date_key)
    if rc != 0:
        failures += 1
        log("✗ scoring failed — stopping the enrichment chain")
        return 1

    # 3. Metadata enrichment. Independent of scoring failures above.
    rc = run("fetch_metadata.py", [date_key, "--limit", "60"], "metadata", date_key)
    if rc != 0:
        failures += 1

    # 4. Classification is a hard publishing gate for enrichment.
    rc = run("classify.py", [date_key], "classify", date_key)
    if rc != 0:
        failures += 1
        log("✗ classification failed — skipping enrichment")
        return 1

    # 5. LLM write-ups. This stage health-checks Claude before processing and
    #    keeps generated output cached so a later run can resume safely.
    rc = run("enrich.py", [date_key, "--limit", "20"], "enrich", date_key)
    if rc != 0:
        failures += 1

    # 6. Content sync. Pulls repos posted to Instagram/YouTube by the other
    #    session's pipeline so the site always covers what has a video.
    rc = run("sync_content.py", [], "sync_content", date_key)
    if rc != 0:
        failures += 1

    # 7. Not yet implemented — preserve the gap explicitly in the run ledger.
    record("digests", date_key, "skipped", "weekly/monthly generation pending", None, time.time())
    log("· digests: skipped (weekly/monthly generation pending)")

    log(f"=== done, {failures} stage failure(s) ===")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
