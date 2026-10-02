"""
GitTiger — Postgres store.

One place where pipeline data is written and read back. Until a real Postgres is
provisioned it transparently falls back to the JSONL/JSON files already produced
by ingest.py / score.py / fetch_metadata.py, so the pipeline works locally with
zero setup and upgrades by setting one DATABASE_URL.

Connection handling:
  - one module-level connection, lazily opened
  - statements run inside a context manager that retries on a dead connection
  - writes are transactional; a crash mid-batch never half-writes a snapshot day
"""

from __future__ import annotations

import json
import os
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

DATA = Path(__file__).parent / "data"

try:  # psycopg[binary] is optional in the local-only phase
    import psycopg
except ImportError:  # pragma: no cover
    psycopg = None  # type: ignore[assignment]

_lock = threading.Lock()
_conn: Any = None


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


def _connect() -> Any:
    assert psycopg is not None, "psycopg is not installed"
    return psycopg.connect(_database_url(), autocommit=False)


def _is_dead(err: Exception) -> bool:
    msg = str(err).lower()
    return any(
        s in msg
        for s in ("server closed the connection", "connection already closed", "terminat")
    )


@contextmanager
def cursor() -> Iterator[Any]:
    """A cursor that survives a stale connection by reconnecting once."""
    global _conn
    if not _database_url() or psycopg is None:
        raise RuntimeError("no DATABASE_URL configured — use the file store")

    with _lock:
        for attempt in range(2):
            try:
                if _conn is None or _conn.closed:
                    _conn = _connect()
                cur = _conn.cursor()
                try:
                    yield cur
                    _conn.commit()
                    return
                except Exception as e:
                    _conn.rollback()
                    if _is_dead(e) and attempt == 0:
                        _conn = None  # reconnect and retry once
                        continue
                    raise
            except Exception as e:
                if _is_dead(e) and attempt == 0:
                    _conn = None
                    continue
                raise
        raise RuntimeError("unreachable")


def postgres_available() -> bool:
    if not _database_url() or psycopg is None:
        return False
    try:
        with cursor() as cur:
            cur.execute("select 1")
        return True
    except Exception:
        return False


# ─────────────────────────  file fallback ─────────────────────────


def _file_read(name: str) -> Any:
    p = DATA / name
    if not p.exists():
        return None
    if p.suffix == ".jsonl":
        return [json.loads(l) for l in p.read_text().splitlines() if l.strip()]
    return json.loads(p.read_text())


def _file_write(name: str, rows: list[dict]) -> Path:
    p = DATA / name
    tmp = p.with_suffix(".tmp")
    if p.suffix == ".jsonl":
        tmp.write_text("".join(json.dumps(r) + "\n" for r in rows))
    else:
        tmp.write_text(json.dumps(rows, indent=2))
    tmp.replace(p)
    return p


# ─────────────────────────  snapshot day  ─────────────────────────
# The core write: one row per repo per day. Idempotent by (repo, date).


UPSERT_SNAPSHOT = """
INSERT INTO repo_snapshots (repo_id, snapshot_date, stars, stars_today, forks, score, rank)
SELECT r.id, %s, %s, %s, %s, %s, %s
FROM repos r WHERE r.full_name = %s
ON CONFLICT (repo_id, snapshot_date) DO UPDATE
SET stars = EXCLUDED.stars,
    stars_today = EXCLUDED.stars_today,
    forks = EXCLUDED.forks,
    score = EXCLUDED.score,
    rank = EXCLUDED.rank
"""

UPSERT_REPO = """
INSERT INTO repos (full_name, owner, name, description, language, stars, forks,
                   created_at, license, html_url, readme_preview, in_niche, updated_at)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, now())
ON CONFLICT (full_name) DO UPDATE
SET description = EXCLUDED.description,
    language   = EXCLUDED.language,
    stars      = EXCLUDED.stars,
    forks      = EXCLUDED.forks,
    license    = EXCLUDED.license,
    readme_preview = EXCLUDED.readme_preview,
    updated_at = now()
RETURNING id
"""


def record_run(job: str, argument: str, status: str, detail: str, rows: int | None) -> None:
    """Pipeline bookkeeping in either store."""
    rec = {
        "job": job,
        "argument": argument,
        "status": status,
        "detail": detail[:500],
        "rows_affected": rows,
    }
    if postgres_available():
        try:
            with cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO pipeline_runs (job, argument, status, detail, rows_affected, finished_at)
                    VALUES (%s, %s, %s, %s, %s, now())
                    ON CONFLICT (job, argument) DO UPDATE
                    SET status = EXCLUDED.status, detail = EXCLUDED.detail,
                        rows_affected = EXCLUDED.rows_affected, finished_at = now()
                    """,
                    (job, argument, status, detail, rows),
                )
            return
        except Exception:
            pass  # fall through to the file ledger
    ledger = DATA / "pipeline_runs.jsonl"
    with ledger.open("a") as f:
        f.write(json.dumps(rec) + "\n")


def save_ranking(date_key: str, rows: list[dict]) -> None:
    """Persist a daily ranking. Postgres if configured, JSONL otherwise."""
    if postgres_available():
        try:
            with cursor() as cur:
                for r in rows:
                    cur.execute(
                        UPSERT_REPO,
                        (
                            r["repo"], r["owner"], r["name"], None, None,
                            r["stars_total"], 0, None, None,
                            f"https://github.com/{r['repo']}", None,
                        ),
                    )
                    repo_id = cur.fetchone()
                    if repo_id:
                        cur.execute(
                            UPSERT_SNAPSHOT,
                            (date_key, r["stars_total"], r["stars_today"], 0, r["score"], r["rank"], r["repo"]),
                        )
            return
        except Exception:
            pass  # degrade to file rather than losing the day
    _file_write(f"ranking-{date_key}.json", rows)


def load_ranking(date_key: str) -> list[dict] | None:
    if postgres_available():
        try:
            with cursor() as cur:
                cur.execute(
                    """
                    SELECT r.full_name, r.owner, r.name, s.stars, s.stars_today,
                           s.score, s.rank, s.snapshot_date::text
                    FROM repo_snapshots s JOIN repos r ON r.id = s.repo_id
                    WHERE s.snapshot_date = %s ORDER BY s.rank
                    """,
                    (date_key,),
                )
                cols = [d.name for d in cur.description]
                out = [dict(zip(cols, row)) for row in cur.fetchall()]
                if out:
                    return out
        except Exception:
            pass
    return _file_read(f"ranking-{date_key}.json")


def save_metadata(meta: dict[str, dict]) -> None:
    if postgres_available():
        try:
            with cursor() as cur:
                for full, m in meta.items():
                    cur.execute(
                        UPSERT_REPO,
                        (
                            full, m["owner"], m["name"], m.get("description"),
                            m.get("language"), m.get("stargazers_count", 0),
                            m.get("forks_count", 0), m.get("created_at"),
                            m.get("license"), m.get("html_url") or f"https://github.com/{full}",
                            m.get("readme_preview"),
                        ),
                    )
            return
        except Exception:
            pass
    _file_write("metadata.json", meta)


def load_metadata() -> dict[str, dict]:
    return _file_read("metadata.json") or {}


def save_writeup(full_name: str, writeup: dict[str, Any]) -> None:
    """Persist one generated write-up; prefer Postgres, otherwise use atomic JSON."""
    if not full_name or "/" not in full_name:
        raise ValueError("full_name must be owner/name")
    if postgres_available():
        try:
            with cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO repo_writeups (repo_id, body_markdown, faq_json, model, generated_at)
                    SELECT id, %s, %s::jsonb, %s, %s
                    FROM repos WHERE full_name = %s
                    ON CONFLICT (repo_id) DO UPDATE
                    SET body_markdown = EXCLUDED.body_markdown,
                        faq_json = EXCLUDED.faq_json,
                        model = EXCLUDED.model,
                        generated_at = EXCLUDED.generated_at
                    """,
                    (
                        writeup["body_markdown"],
                        json.dumps(writeup.get("faq_json", []), ensure_ascii=False),
                        writeup["model"],
                        writeup["generated_at"],
                        full_name,
                    ),
                )
                if cur.rowcount == 0:
                    raise LookupError(f"cannot persist write-up to PostgreSQL: repo {full_name} is not seeded")
                cur.execute(
                    "UPDATE repos SET enriched_at = %s WHERE full_name = %s",
                    (writeup["generated_at"], full_name),
                )
            return
        except Exception:
            pass  # preserve the generated result in the file store if PostgreSQL fails or is unseeded

    current = _file_read("writeups.json") or {}
    if not isinstance(current, dict):
        raise ValueError("writeups.json has an invalid top-level shape")
    current[full_name] = writeup
    p = DATA / "writeups.json"
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(p)


def load_writeups() -> dict[str, dict]:
    """Load cached write-ups; include file-fallback rows when Postgres is available."""
    result: dict[str, dict] = {}
    if postgres_available():
        try:
            with cursor() as cur:
                cur.execute(
                    """
                    SELECT r.full_name, w.body_markdown, w.faq_json, w.model,
                           w.generated_at::text AS generated_at
                    FROM repo_writeups w JOIN repos r ON r.id = w.repo_id
                    """
                )
                cols = [d.name for d in cur.description]
                rows = [dict(zip(cols, row)) for row in cur.fetchall()]
                result = {
                    row["full_name"]: {
                        "body_markdown": row["body_markdown"],
                        "faq_json": row["faq_json"],
                        "model": row["model"],
                        "generated_at": row["generated_at"],
                    }
                    for row in rows
                }
        except Exception:
            pass
    fallback = _file_read("writeups.json") or {}
    if not isinstance(fallback, dict):
        raise ValueError("writeups.json has an invalid top-level shape")
    # Postgres is authoritative for rows it has, while file-fallback rows remain
    # visible when a DB transaction previously failed or a repo is not seeded yet.
    return {**fallback, **result}
