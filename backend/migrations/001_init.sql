-- Usage Insights – Initial Schema
-- Run this once against your PostgreSQL database

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── accounts ─────────────────────────────────────────────────────────────────
-- Represents a SaaS customer (multi-tenant root entity)
CREATE TABLE IF NOT EXISTS accounts (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── users ────────────────────────────────────────────────────────────────────
-- Individual team members belonging to an account
CREATE TABLE IF NOT EXISTS users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── events ───────────────────────────────────────────────────────────────────
-- Raw event stream – one row per user action tracked in the product
CREATE TABLE IF NOT EXISTS events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  feature     TEXT        NOT NULL,  -- e.g. "dashboard", "export", "search"
  action      TEXT        NOT NULL,  -- e.g. "view", "click", "submit"
  metadata    JSONB,                 -- optional arbitrary key-value payload
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_events_account_occurred
  ON events (account_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_feature
  ON events (account_id, feature);

-- ─── thresholds ───────────────────────────────────────────────────────────────
-- Alert rules: fire when a feature crosses a usage count in a rolling window
CREATE TABLE IF NOT EXISTS thresholds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  feature     TEXT NOT NULL,
  window_days INT  NOT NULL DEFAULT 1,  -- rolling window in days
  limit_count INT  NOT NULL,            -- trigger when count >= this value
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── triggered_alerts ────────────────────────────────────────────────────────
-- Log entry written each time a threshold is crossed
CREATE TABLE IF NOT EXISTS triggered_alerts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_id UUID        NOT NULL REFERENCES thresholds(id) ON DELETE CASCADE,
  account_id   UUID        NOT NULL,
  feature      TEXT        NOT NULL,
  event_count  INT         NOT NULL,  -- the count that triggered this alert
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed data for local development ──────────────────────────────────────────
INSERT INTO accounts (id, name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Acme Corp')
ON CONFLICT DO NOTHING;

INSERT INTO users (id, account_id, name, email) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Alice', 'alice@acme.com'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Bob',   'bob@acme.com')
ON CONFLICT DO NOTHING;
