-- Logic Mosaic Trends — schema
-- See PLAN.md §2/§3. Mirrors src/lib/types.ts on the web side.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────  repos  ─────────────────────────
-- One row per tracked repo. Upserted by fetch_metadata.py.

CREATE TABLE IF NOT EXISTS repos (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name     TEXT NOT NULL UNIQUE,           -- owner/name, GitHub casing preserved
  owner         TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  language      TEXT,
  stars         INTEGER NOT NULL DEFAULT 0,
  forks         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ,                     -- repo creation, not our tracking
  license       TEXT,
  html_url      TEXT NOT NULL,
  readme_preview TEXT,                           -- ≤ 600 chars, summarised not quoted (§9.4)
  in_niche      BOOLEAN NOT NULL DEFAULT TRUE,   -- false = tracked but never published
  enriched_at   TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repos_owner_idx        ON repos (owner);
CREATE INDEX IF NOT EXISTS repos_language_idx     ON repos (language);
CREATE INDEX IF NOT EXISTS repos_stars_idx        ON repos (stars DESC);
CREATE INDEX IF NOT EXISTS repos_niche_stars_idx  ON repos (in_niche, stars DESC)
  WHERE in_niche;

-- ─────────────────────────  topics & tags  ─────────────────────────

CREATE TABLE IF NOT EXISTS topics (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT '#7c5cff'         -- mosaic hue, resolved by the classifier
);

CREATE TABLE IF NOT EXISTS repo_topics (
  repo_id  BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (repo_id, topic_id)
);

-- Tags are free-form and lowercased; topics are the curated ~40.
CREATE TABLE IF NOT EXISTS repo_tags (
  repo_id BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  PRIMARY KEY (repo_id, tag)
);
CREATE INDEX IF NOT EXISTS repo_tags_tag_idx ON repo_tags (tag);

-- ─────────────────────────  daily snapshots  ─────────────────────────
-- One row per repo per UTC day. Feeds star charts, rank history, digests,
-- compare pages and the velocity score.

CREATE TABLE IF NOT EXISTS repo_snapshots (
  repo_id     BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  stars       INTEGER NOT NULL,
  stars_today INTEGER NOT NULL DEFAULT 0,
  forks       INTEGER NOT NULL,
  score       DOUBLE PRECISION NOT NULL,
  rank        INTEGER NOT NULL,
  PRIMARY KEY (repo_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS snapshots_date_rank_idx
  ON repo_snapshots (snapshot_date, rank);

-- ─────────────────────────  classifications  ─────────────────────────
-- Cached classifier output so a repo is only classified once (plus on README change).

CREATE TABLE IF NOT EXISTS repo_classification (
  repo_id     BIGINT PRIMARY KEY REFERENCES repos(id) ON DELETE CASCADE,
  topic_slug  TEXT REFERENCES topics(slug),
  confidence  REAL NOT NULL DEFAULT 0,
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,   -- LLM couldn't place it confidently
  classified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────  enrichment  ─────────────────────────
-- LLM write-ups. Only for published repos; NULL until generated.

CREATE TABLE IF NOT EXISTS repo_writeups (
  repo_id     BIGINT PRIMARY KEY REFERENCES repos(id) ON DELETE CASCADE,
  body_markdown TEXT NOT NULL,
  faq_json    JSONB,                             -- [{q, a}]
  model       TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────  spam / star-farming flags (§9.3) ─────────────────────────

CREATE TABLE IF NOT EXISTS repo_flags (
  repo_id  BIGINT NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
  flag     TEXT NOT NULL,                        -- starfarming | empty_readme | off_niche | denylist
  reason   TEXT,
  PRIMARY KEY (repo_id, flag)
);
CREATE INDEX IF NOT EXISTS repo_flags_flag_idx ON repo_flags (flag);

-- ─────────────────────────  ad inventory (§6) ─────────────────────────
-- Phase A: listings exist but stay pending; Phase B flips bidding on.
-- Slots are site-wide, never per-page, so scarcity holds.

CREATE TABLE IF NOT EXISTS ad_listings (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot        TEXT NOT NULL CHECK (slot IN ('homepage_row','sidebar','feed')),
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT NOT NULL,
  logo_url    TEXT,
  bid_cents   INTEGER NOT NULL,                  -- USD cents; floor 2500 in Phase B
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','active','paused','expired','outbid')),
  starts_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at     TIMESTAMPTZ,                       -- 15 days from activation
  clicks      INTEGER NOT NULL DEFAULT 0,
  house       BOOLEAN NOT NULL DEFAULT FALSE,    -- our own house ad filling an empty board
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_listings_slot_status_idx
  ON ad_listings (slot, status, bid_cents DESC);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES ad_listings(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_bot     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS ad_clicks_listing_idx ON ad_clicks (listing_id, clicked_at);

-- ─────────────────────────  pipeline bookkeeping  ─────────────────────────
-- Idempotency + observability for the ingest/scoring jobs.

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job         TEXT NOT NULL,                     -- ingest | score | enrich | digest
  argument    TEXT NOT NULL,                     -- e.g. the hour key or date
  status      TEXT NOT NULL,                     -- ok | failed | skipped
  detail      TEXT,
  rows_affected INTEGER,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  UNIQUE (job, argument)
);

-- ─────────────────────────  newsletter (§9.6) ─────────────────────────

CREATE TABLE IF NOT EXISTS subscribers (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  confirmed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────  sponsor enquiries (Phase A) ─────────────────────────

CREATE TABLE IF NOT EXISTS enquiries (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('promote','advertise','contact')),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  link       TEXT,
  message    TEXT,
  handled    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enquiries_unhandled_idx ON enquiries (handled, created_at);
