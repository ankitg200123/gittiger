"""
GitTiger — niche classifier.

Assigns each repo one of ~40 curated AI/dev-tool topics plus free-form tags.
Rules come first (GitHub topics + keyword matching); the LLM only handles repos
the rules cannot place confidently. Everything outside the niche is tracked for
data but flagged off_niche and never published (PLAN.md §3.3).

Spam / star-farming detection (§9.3) runs here too, since that is the gate
between ingestion and publication.

Usage: python3 classify.py 2026-10-01
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import store

DATA = Path(__file__).parent / "data"

# ─────────────────────────  topic catalogue  ─────────────────────────
# Ordered so an earlier, more specific match wins over a later, broader one.

TOPIC_RULES: list[tuple[str, list[str]]] = [
    ("ai-agent", ["ai-agent", "ai agent", "autonomous-agent", "agent-framework", "agentic", "ai-agents"]),
    ("ai-coding-assistant", ["coding-assistant", "code-assistant", "copilot", "ai-coding", "code-completion", "autocomplete"]),
    ("mcp", ["mcp", "model-context-protocol", "model context protocol"]),
    ("rag", ["rag", "retrieval-augmented", "retrieval augmented"]),
    ("local-llm", ["local-llm", "local-llms", "ollama", "llamacpp", "llama.cpp", "on-device-llm", "private-llm"]),
    ("ai-video-generation", ["video-generation", "ai-video", "text-to-video", "video-synthesis", "ai-filmmaking"]),
    ("ai-image-generation", ["image-generation", "text-to-image", "stable-diffusion", "ai-art", "image-synthesis", "flux"]),
    ("ai-voice", ["voice", "tts", "text-to-speech", "speech-synthesis", "voice-cloning", "voice-assistant"]),
    ("vector-database", ["vector-database", "vector-db", "vector-search", "embedding-database", "ann-index"]),
    ("computer-vision", ["computer-vision", "cv", "object-detection", "image-segmentation", "ocr", "pose-estimation"]),
    ("text-to-speech", ["tts", "text-to-speech", "speech"]),
    ("nlp", ["nlp", "natural-language", "tokenization", "ner", "sentiment-analysis"]),
    ("workflow-automation", ["workflow", "automation", "no-code", "pipeline", "orchestration", "rpa"]),
    ("browser-automation", ["browser-automation", "web-scraping", "playwright", "puppeteer", "selenium", "headless-browser", "crawler"]),
    ("code-review", ["code-review", "static-analysis", "linter", "linting", "vulnerability-detection", "security-audit"]),
    ("devtools", ["developer-tools", "devtools", "cli", "terminal", "command-line", "shell"]),
    ("testing", ["testing", "test-framework", "e2e", "integration-testing", "mocking"]),
    ("observability", ["observability", "monitoring", "logging", "tracing", "apm", "telemetry"]),
    ("self-hosted", ["self-hosted", "selfhosted", "homelab", "docker", "kubernetes", "home-server"]),
    ("database", ["database", "sqlite", "postgres", "mysql", "redis", "clickhouse"]),
    ("ui-components", ["ui-components", "component-library", "design-system", "ui-kit", "components"]),
    ("bundler", ["bundler", "build-tool", "webpack", "vite", "esbuild", "rollup", "compiler"]),
    ("webassembly", ["wasm", "webassembly"]),
    ("game-development", ["game-development", "game-engine", "gamedev", "opengl", "vulkan"]),
    ("devops", ["devops", "ci-cd", "deployment", "infrastructure-as-code", "terraform", "ansible"]),
]

# Outside the AI/dev-tool niche -> tracked, never published.
OFF_NICHE = [
    "crypto", "blockchain", "defi", "nft", "web3", "solana", "ethereum", "bitcoin",
    "trading-bot", "trading", "forex", "betting", "casino", "gambling",
    "adult", "porn",
    "resume", "job-board", "dating",
]

DENYLIST_RE = re.compile(
    r"(secrets?\s*(?:dump|leak)|leaked?\s*(?:secrets|token|key|credit)|api[-_]?keys?\s*dump"
    r"|porn|xxx|casino|betting\s*(?:site|bot)|airdrop|presale|giveaway\s*(?:bot|boost))",
    re.IGNORECASE,
)

TOPIC_SLUGS = [slug for slug, _ in TOPIC_RULES]


def classify_topics(repo_topics: list[str], description: str | None, name: str) -> tuple[str | None, list[str], float]:
    """Returns (topic_slug, tags, confidence). Rules first; confidence < 0.5 means review."""
    haystack = " ".join(repo_topics).lower()
    desc = (description or "").lower()

    for slug, keys in TOPIC_RULES:
        for k in keys:
            if k in haystack:
                return slug, repo_topics[:6], 0.95

    # GitHub topics didn't hit — try the description with a lower confidence.
    for slug, keys in TOPIC_RULES:
        for k in keys:
            if k in desc:
                return slug, repo_topics[:6], 0.65

    return None, repo_topics[:6], 0.0


def is_off_niche(repo_topics: list[str], description: str | None) -> bool:
    hay = " ".join(repo_topics).lower()
    desc = (description or "").lower()
    return any(k in hay or k in desc for k in OFF_NICHE)


def looks_like_spam(meta: dict) -> str | None:
    """Heuristic star-farming / low-quality gate (PLAN.md §9.3)."""
    desc = (meta.get("description") or "").strip()
    name = meta.get("name", "")
    readme = meta.get("readme_preview") or ""

    if DENYLIST_RE.search(name):
        return "denylist"
    if not desc and not readme:
        return "empty_readme"
    if len(desc) < 8 and not readme:
        return "thin"
    return None


def velocity_is_organic(stars_today: int, stars_total: int, created_at: str | None) -> bool:
    """A repo gaining a large share of its lifetime stars in one day is suspicious.

    Only meaningful for repos young enough that farming is plausible: an
    established repo's ratio is diluted by years of history, so the check is
    skipped entirely past 365 days. New repos (<30 days) get a launch allowance.
    """
    if stars_today <= 0 or not created_at:
        return True
    try:
        age_days = (datetime.now(timezone.utc) - datetime.fromisoformat(created_at.replace("Z", "+00:00"))).days
    except Exception:
        return True
    if age_days > 365:
        return True
    if age_days < 30:
        return stars_today / max(stars_total, 1) < 0.9  # launch spike is normal
    return stars_today / max(stars_total, 1) < 0.5


# ─────────────────────────  main  ─────────────────────────


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("date")
    args = ap.parse_args(argv[1:])

    ranking = store.load_ranking(args.date)
    if not ranking:
        print(f"[FAIL] no ranking for {args.date}")
        return 1

    meta = store.load_metadata()
    classified = flagged = off_niche = 0
    needs_review: list[str] = []

    out: dict[str, dict] = {}
    for row in ranking[:200]:
        full = row["repo"]
        m = meta.get(full)
        topics = (m or {}).get("topics", [])
        desc = (m or {}).get("description")
        name = (m or {}).get("name", full.split("/")[-1])

        topic, tags, confidence = classify_topics(topics, desc, name)

        flags: list[str] = []
        if m:
            spam = looks_like_spam(m)
            if spam:
                flags.append(spam)
            if is_off_niche(topics, desc):
                flags.append("off_niche")
                off_niche += 1
            if not velocity_is_organic(
                row.get("stars_today", 0), row.get("stars_total", 0), m.get("created_at")
            ):
                flags.append("starfarming")

        if topic:
            classified += 1
        else:
            needs_review.append(full)

        if flags:
            flagged += 1

        out[full] = {
            "topic": topic,
            "tags": tags,
            "confidence": round(confidence, 2),
            "flags": flags,
            "needs_review": topic is None,
        }

    path = DATA / f"classification-{args.date}.json"
    path.write_text(json.dumps(out, indent=2))

    print(
        f"[OK] {args.date}: classified {classified}/{len(out)}, "
        f"{len(needs_review)} need LLM review, {flagged} flagged, {off_niche} off-niche"
    )
    if needs_review[:5]:
        print(f"  review queue sample: {', '.join(needs_review[:5])}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
