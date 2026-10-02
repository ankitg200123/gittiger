"""
GitTiger — GitHub metadata enrichment.

Fetches repo metadata (description, language, topics, totals, README preview)
for repos that surfaced in the rankings, through the unauthenticated GitHub
REST API with generous rate-limit handling.

Resilience contract (PLAN.md §3.5): per-item try/except, hard deadline,
transient-vs-permanent failure distinction, and a verified credential check
before the batch starts.

Usage: python3 fetch_metadata.py 2026-10-01 [--limit 60]
       GITHUB_TOKEN=ghp_... python3 fetch_metadata.py 2026-10-01
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

DATA = Path(__file__).parent / "data"
META_PATH = DATA / "metadata.json"
RANKING_PATH = DATA / "ranking-2026-10-01.json"
API = "https://api.github.com"
USER_AGENT = "GitTiger/0.1 (+https://gittiger.com)"
DEADLINE_S = 1200
MAX_API_BYTES = 1_048_576
README_MAX_BYTES = 32_768  # preview only — full text lives on the repo page
README_SUMMARY_VERSION = 2
MAX_METADATA_TARGETS = 250
RATE_LIMIT_RESERVE = 10
Niche = "AI / developer tools"

# ─────────────────────────  http  ─────────────────────────


class DeadlineExpired(RuntimeError):
    """The batch hard deadline elapsed before an API attempt."""


class Deadline:
    def __init__(self, seconds: float) -> None:
        self.start = time.monotonic()
        self.seconds = seconds

    @property
    def remaining(self) -> float:
        return max(0.0, self.seconds - (time.monotonic() - self.start))

    @property
    def expired(self) -> bool:
        return self.remaining <= 0


def api_get(path: str, deadline: Deadline, token: str | None) -> dict | bytes | None:
    """One bounded GET. Returns parsed JSON, raw README bytes, or None on 404."""
    if deadline.expired:
        raise DeadlineExpired("GitHub API deadline expired before request")
    is_readme = path.endswith("/readme")
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/vnd.github.raw" if is_readme else "application/vnd.github+json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(f"{API}{path}", headers=headers)
    try:
        per_call = min(30, deadline.remaining)
        with urllib.request.urlopen(req, timeout=per_call) as resp:
            max_bytes = README_MAX_BYTES if is_readme else MAX_API_BYTES
            body = resp.read(max_bytes + 1)
            if len(body) > max_bytes:
                if is_readme:
                    # Preserve the sentinel byte; readme_preview rejects this as truncated.
                    return body
                raise ValueError(f"GitHub response exceeds {max_bytes}-byte limit")
            if not is_readme:
                content_type = resp.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
                if content_type != "application/json" and not content_type.endswith("+json"):
                    raise ValueError("GitHub API returned a non-JSON repository response")
                return json.loads(body)
            return body
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        has_primary_limit = e.headers.get("X-RateLimit-Remaining") == "0"
        has_secondary_limit = bool(e.headers.get("Retry-After"))
        if e.code == 429 or (e.code == 403 and (has_primary_limit or has_secondary_limit)):
            retry_after = resp_reset(e)
            raise RateLimited(f"HTTP {e.code} (retry after {retry_after}s)", retry_after=retry_after) from e
        raise
    except (TimeoutError, urllib.error.URLError) as e:
        if deadline.expired:
            raise DeadlineExpired(f"GitHub request deadline expired: {e}") from e
        raise


def resp_reset(e: urllib.error.HTTPError) -> float | None:
    """Seconds to wait from Retry-After or the GitHub reset epoch."""
    retry_after = e.headers.get("Retry-After")
    if retry_after:
        try:
            return max(0.0, float(retry_after))
        except (TypeError, ValueError):
            pass
    try:
        reset_at = float(e.headers.get("X-RateLimit-Reset", ""))
        return max(0.0, reset_at - time.time())
    except (TypeError, ValueError):
        return None


def candidate_budget(remaining: int) -> int:
    """Worst-case metadata+README call budget, including the rate-limit probe."""
    try:
        return min(
            MAX_METADATA_TARGETS,
            max(0, int(remaining - RATE_LIMIT_RESERVE - 1) // 2),
        )
    except (TypeError, ValueError):
        return 0


def call_budget(targets: list[dict], meta: dict[str, dict], remaining: int) -> int:
    """Cap work to the actual outstanding requests plus the safety reserve."""
    try:
        available = max(0, int(remaining) - RATE_LIMIT_RESERVE - 1)
    except (TypeError, ValueError):
        return 0
    calls_per_target = sum(
        1 + (1 if (meta.get(row["repo"], {}).get("readme_summary_version") != README_SUMMARY_VERSION) else 0)
        for row in targets
    )
    if calls_per_target <= available:
        return len(targets)
    selected: list[dict] = []
    used = 0
    for row in targets:
        cost = 1 + (1 if meta.get(row["repo"], {}).get("readme_summary_version") != README_SUMMARY_VERSION else 0)
        if used + cost > available:
            break
        selected.append(row)
        used += cost
    return len(selected)


class RateLimited(Exception):
    """A retryable GitHub rate limit with its server-provided delay if available."""

    def __init__(self, message: str, retry_after: float | None = None) -> None:
        super().__init__(message)
        self.retry_after = retry_after


def wait_before_rate_limit_retry(exc: RateLimited, deadline: Deadline) -> None:
    """Sleep once within the deadline; never silently retry before the server allows."""
    if deadline.expired:
        raise DeadlineExpired("deadline expired after GitHub rate limit")
    wait = exc.retry_after
    if wait is None:
        # A secondary rate limit may omit headers; bounded default cooldown.
        wait = 60.0
    if wait > deadline.remaining:
        raise RuntimeError(
            f"rate-limit retry requires {wait:.0f}s, exceeds remaining deadline "
            f"of {deadline.remaining:.0f}s"
        )
    if wait > 0:
        time.sleep(wait)
    if deadline.expired:
        raise DeadlineExpired("deadline expired during GitHub rate-limit wait")


def check_rate_limit(deadline: Deadline, token: str | None) -> int:
    """Verify the credential/source works before dispatching the batch."""
    try:
        core = api_get("/rate_limit", deadline, token)
    except Exception as exc:
        raise RuntimeError(f"cannot reach the GitHub API: {exc}") from exc
    if not isinstance(core, dict):
        raise RuntimeError("unexpected /rate_limit response")
    try:
        resource = core["resources"]["core"]
        remaining = int(resource["remaining"])
        limit = resource.get("limit", "?")
    except (KeyError, TypeError, ValueError) as exc:
        raise RuntimeError("unexpected /rate_limit core resource") from exc
    print(f"  rate limit: {remaining}/{limit} remaining", flush=True)
    if remaining <= RATE_LIMIT_RESERVE + 1:
        raise RuntimeError(f"only {remaining} API calls left — refusing to start the batch")
    return remaining


# ─────────────────────────  README preview  ─────────────────────────


def select_targets(
    ranking: list[dict], meta: dict[str, dict], *, limit: int
) -> list[dict]:
    """Select repos needing metadata or a v2 README summary, in rank order."""
    targets: list[dict] = []
    seen: set[str] = set()
    for rec in ranking:
        full = rec.get("repo")
        if not isinstance(full, str) or not full or full in seen:
            continue
        seen.add(full)
        existing = meta.get(full)
        if existing and existing.get("metadata_status") == "not_found":
            continue
        if existing and existing.get("readme_summary_version") == README_SUMMARY_VERSION:
            continue
        targets.append(rec)
        if len(targets) >= limit:
            break
    return targets


def readme_preview_text(raw: bytes) -> str | None:
    """Extract a small feature summary instead of sending quoted README prose to the LLM."""
    if not raw or len(raw) > README_MAX_BYTES:
        return None
    try:
        source = raw.decode("utf-8")
    except UnicodeDecodeError:
        return None

    summary_candidates: list[str] = []
    lines_by_section: list[tuple[str, str]] = []
    section = ""
    for raw_line in source.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        heading = re.match(r"^#{1,6}\s+(.+)$", line)
        if heading:
            section = heading.group(1).casefold()
            title = html.unescape(re.sub(r"[`*_~]", "", heading.group(1))).strip()
            if title and len(title) <= 100 and not any(term in title.casefold() for term in ("feature", "install", "usage", "overview", "contents", "table of", "screenshot")):
                lines_by_section.append(("title", title))
            continue
        if re.fullmatch(r"(?:!\[[^\]]*\]\([^)]*\)|\[[^\]]*\]:\s*\S+)", line):
            continue
        line = re.sub(r"<[^>]*>", " ", line)
        line = html.unescape(line)
        line = re.sub(r"!\[([^\]]*)\]\([^)]*\)", r"\1", line)
        line = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", line)
        line = re.sub(r"<https?://[^>]+>", "", line, flags=re.IGNORECASE)
        line = re.sub(r"https?://\S+", "", line, flags=re.IGNORECASE)
        line = re.sub(r"(?:`{1,3}|\*{1,3}|_{1,3}|~~)", "", line)
        bullet = bool(re.match(r"^\s*(?:[-+*]\s+|\d+[.)]\s+)", line))
        line = re.sub(r"^\s*(?:[-+*]\s+|\d+[.)]\s+)", "", line)
        line = line.replace("—", "-")
        line = re.sub(r"\s+", " ", line).strip(" -|:·")
        if not line or len(line) < 12 or len(line) > 300:
            continue
        if re.search(r"(?:\d[,.]?\d*\s*[kmb]?\s*stars?\b|stars?\s*[:=]?\s*\d)", line, re.IGNORECASE):
            continue
        if re.match(r"^(?:install|installation|getting started|quick start|usage|run |npm install|pip install|git clone)\b", line, re.IGNORECASE):
            continue
        if any(term in section for term in ("installation", "getting started", "quick start", "usage", "screenshots", "contributors", "license", "changelog", "table of contents")):
            continue
        if bullet or any(term in section for term in ("feature", "what it", "highlights", "capabilit", "overview")):
            lines_by_section.append(("feature", line))
        elif len(line.split()) >= 4:
            summary_candidates.append(line)

    project_title = next((line for kind, line in lines_by_section if kind == "title"), None)
    summary = summary_candidates[0] if summary_candidates else next((line for kind, line in lines_by_section if kind == "feature"), None)
    if not summary:
        return None
    features = []
    for kind, line in lines_by_section:
        if kind != "feature" or line.casefold() == summary.casefold():
            continue
        if line not in features:
            features.append(line)
        if len(features) == 5:
            break
    pieces = [f"Summary: {summary}"]
    if project_title:
        pieces.append(f"Project: {project_title}")
    if features:
        pieces.append("Features: " + "; ".join(features))
    result = " ".join(pieces)
    return result[:600].rsplit(" ", 1)[0] if len(result) > 600 else result


def readme_preview(full_name: str, deadline: Deadline, token: str | None) -> str | None:
    """Short README feature summary; avoid quoting long first-party text."""
    raw = api_get(f"/repos/{full_name}/readme", deadline, token)
    if raw is None or isinstance(raw, dict):
        return None
    return readme_preview_text(raw)


# ─────────────────────────  main  ─────────────────────────


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("date", help="ranking date, e.g. 2026-10-01")
    ap.add_argument("--limit", type=int, default=60, help="max repos to enrich")
    args = ap.parse_args(argv[1:])
    if args.limit < 1:
        ap.error("--limit must be at least 1")

    ranking_path = RANKING_PATH
    if not ranking_path.exists():
        print(f"[FAIL] no ranking for {args.date} — run score.py first")
        return 1
    ranking = json.loads(ranking_path.read_text())

    token = os.environ.get("GITHUB_TOKEN")
    deadline = Deadline(DEADLINE_S)

    try:
        api_budget = check_rate_limit(deadline, token)
    except RuntimeError as e:
        print(f"[FAIL] {e}")
        return 1

    # Preserve cached descriptions; retry incomplete README fetches on the next run.
    meta_path = META_PATH
    meta: dict[str, dict] = {}
    if meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text())
            if not isinstance(meta, dict):
                raise ValueError("metadata.json has an invalid top-level shape")
        except Exception as e:
            print(f"[FAIL] cannot read metadata.json: {e}")
            return 1

    remaining_calls = max(0, api_budget - 1)  # exclude the successful /rate_limit probe
    fetched = skipped = failed = 0
    try:
        requested = min(args.limit, MAX_METADATA_TARGETS)
        candidates = select_targets(ranking, meta, limit=requested)
        budgeted = call_budget(candidates, meta, remaining_calls)
        targets = candidates[:budgeted]
    except (TypeError, ValueError, AttributeError, KeyError) as exc:
        print(f"[FAIL] invalid ranking or metadata shape: {exc}")
        return 1

    print(
        f"[metadata] {len(targets)} to fetch (requested limit {args.limit}, "
        f"budgeted {len(targets)}, {len(meta)} cached)",
        flush=True,
    )

    def save_metadata() -> None:
        tmp = meta_path.with_suffix(".tmp")
        try:
            tmp.write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            tmp.replace(meta_path)
        finally:
            if tmp.exists():
                tmp.unlink()

    def get_with_rate_limit(path: str) -> dict | bytes | None:
        try:
            return api_get(path, deadline, token)
        except RateLimited as e:
            wait_before_rate_limit_retry(e, deadline)
            return api_get(path, deadline, token)

    for rec in targets:
        if deadline.expired:
            print(f"[WARN] deadline reached — stopping after {fetched} repos", flush=True)
            failed += 1
            break
        full = rec["repo"]
        try:
            info = get_with_rate_limit(f"/repos/{full}")
        except Exception as e:
            print(f"  [skip] {full}: metadata request failed: {e}", flush=True)
            failed += 1
            continue

        if info is None:
            existing = meta.get(full, {})
            meta[full] = {**existing, "metadata_status": "not_found"}
            save_metadata()
            print(f"  [skip] {full}: repository not found", flush=True)
            skipped += 1
            continue
        if not isinstance(info, dict):
            print(f"  [skip] {full}: unexpected repository response", flush=True)
            failed += 1
            continue

        existing = meta.get(full, {})
        preview = existing.get("readme_preview")
        readme_summary = existing.get("readme_summary")
        summary_version = existing.get("readme_summary_version")
        readme_checked_at = existing.get("readme_checked_at")
        readme_error = None
        if summary_version != README_SUMMARY_VERSION:
            try:
                raw_preview = readme_preview(full, deadline, token)
                if raw_preview:
                    preview = preview or raw_preview
                    readme_summary = raw_preview
                else:
                    readme_summary = None
                summary_version = README_SUMMARY_VERSION
                readme_checked_at = datetime.now(timezone.utc).isoformat()
            except Exception as e:
                # Preserve prior first-party fields; retry the summary on a later run.
                readme_error = str(e)[:300]
                print(f"  [WARN] {full}: README summary fetch failed (will retry): {readme_error}", flush=True)
                failed += 1

        meta[full] = {
            **existing,
            "full_name": full,
            "owner": info.get("owner", {}).get("login", full.split("/")[0]),
            "name": info.get("name", full.split("/")[-1]),
            "description": info.get("description") or "",
            "language": info.get("language"),
            "stargazers_count": info.get("stargazers_count", 0),
            "forks_count": info.get("forks_count", 0),
            "created_at": info.get("created_at"),
            "topics": info.get("topics", []),
            "license": (info.get("license") or {}).get("spdx_id"),
            "html_url": info.get("html_url"),
            "readme_preview": preview,
            "readme_summary": readme_summary,
            "readme_summary_version": summary_version,
            "readme_checked_at": readme_checked_at,
            "readme_last_error": readme_error,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        save_metadata()
        fetched += 1

        if fetched % 10 == 0:
            print(f"  {fetched} fetched…", flush=True)

    print(
        f"[OK] {args.date}: fetched {fetched}, skipped {skipped}, failed {failed} "
        f"-> metadata.json ({len(meta)} total)",
        flush=True,
    )
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
