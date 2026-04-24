# Usage Insights – Architecture & Design Document

**Version:** 1.0  
**Author:** Gaurav Gupta  
**Date:** April 2026  
**Stack:** Node.js + Express · React.js · PostgreSQL

---

## 1. Overview

Usage Insights is a feature that lets SaaS customers understand **how their team uses the product**. It collects event data in real time, presents usage charts (by day, feature, or team member), and sends alerts when usage crosses defined thresholds.

The goal of this document is to describe the architecture, data model, API design, data flow, and a scaling strategy for this feature.

---

## 2. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                        │
│                                                                │
│   React Dashboard ──────────────────────────────────────────  │
│   (Usage charts, threshold config, alert history)             │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTP / REST
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                  Node.js + Express API Server                   │
│                                                                │
│  ┌────────────┐  ┌─────────────────┐  ┌──────────────────┐   │
│  │  /events   │  │  /insights      │  │  /alerts         │   │
│  │ (Ingest)   │  │  (Query/Agg.)   │  │  (CRUD + Check)  │   │
│  └─────┬──────┘  └────────┬────────┘  └────────┬─────────┘   │
│        │                  │                      │             │
│        └──────────────────┼──────────────────────┘            │
│                           │                                    │
│              ┌────────────▼────────────┐                      │
│              │    AlertService          │                      │
│              │ (checks thresholds on   │                      │
│              │  each event ingestion)  │                      │
│              └────────────┬────────────┘                      │
└───────────────────────────┼────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                              │
│                                                                │
│   accounts │ users │ events │ thresholds │ triggered_alerts   │
└────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|---|---|
| **React Dashboard** | Display usage charts, configure thresholds, view alerts |
| **Express API** | Route requests, validate input, orchestrate services |
| **EventService** | Persist raw events, trigger alert check post-ingestion |
| **InsightService** | Aggregate event data by day / feature / user |
| **AlertService** | Evaluate thresholds, record triggered alerts |
| **PostgreSQL** | Single source of truth for all persistent data |

---

## 3. Data Model

### 3.1 Entity Relationship

```
accounts ──< users ──< events
accounts ──< thresholds
accounts ──< triggered_alerts
```

### 3.2 Table Definitions

#### `accounts`
Represents a SaaS customer (multi-tenant root).

```sql
CREATE TABLE accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `users`
Individual people within an account (team members).

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `events`
Raw event stream — one row per user action.

```sql
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature     TEXT NOT NULL,           -- e.g. "dashboard", "export", "search"
  action      TEXT NOT NULL,           -- e.g. "view", "click", "submit"
  metadata    JSONB,                   -- optional arbitrary payload
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_account_occurred ON events (account_id, occurred_at DESC);
CREATE INDEX idx_events_feature ON events (account_id, feature);
```

#### `thresholds`
Alert rules defined per account per feature.

```sql
CREATE TABLE thresholds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  feature     TEXT NOT NULL,
  window_days INT  NOT NULL DEFAULT 1,   -- rolling window: last N days
  limit_count INT  NOT NULL,             -- alert when event count >= this
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `triggered_alerts`
Log of when a threshold was crossed.

```sql
CREATE TABLE triggered_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_id  UUID NOT NULL REFERENCES thresholds(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL,
  feature       TEXT NOT NULL,
  event_count   INT  NOT NULL,           -- count that triggered it
  triggered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 4. API Design

### Base URL
```
http://localhost:4000/api
```

### 4.1 Event Ingestion

**`POST /api/events`**  
Ingest a single user event. After saving, the service checks all active thresholds for the account.

**Request Body:**
```json
{
  "accountId": "uuid",
  "userId": "uuid",
  "feature": "dashboard",
  "action": "view",
  "metadata": { "page": "home" }
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "message": "Event recorded"
}
```

---

### 4.2 Usage Insights (Query)

**`GET /api/insights`**  
Returns aggregated usage data for charts.

**Query Parameters:**

| Param | Required | Default | Description |
|---|---|---|---|
| `accountId` | ✅ | — | Filter by account |
| `groupBy` | ✅ | — | `day` \| `feature` \| `user` |
| `from` | ❌ | 30 days ago | ISO date string |
| `to` | ❌ | now | ISO date string |
| `feature` | ❌ | all | Filter by specific feature |

**Response `200` (example – `groupBy=day`):**
```json
{
  "groupBy": "day",
  "data": [
    { "label": "2026-04-20", "count": 142 },
    { "label": "2026-04-21", "count": 98 },
    { "label": "2026-04-22", "count": 210 }
  ]
}
```

---

### 4.3 Thresholds (Alert Rules)

**`POST /api/alerts/thresholds`**  
Create a new threshold rule.

**Request Body:**
```json
{
  "accountId": "uuid",
  "feature": "export",
  "windowDays": 1,
  "limitCount": 100
}
```

**`GET /api/alerts/thresholds?accountId=uuid`**  
List all thresholds for an account.

**`DELETE /api/alerts/thresholds/:id`**  
Remove a threshold rule.

---

### 4.4 Triggered Alerts (Alert History)

**`GET /api/alerts/triggered?accountId=uuid`**  
Returns all alerts that have fired for an account.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "feature": "export",
    "eventCount": 102,
    "limitCount": 100,
    "windowDays": 1,
    "triggeredAt": "2026-04-22T14:32:00Z"
  }
]
```

---

## 5. Data Flow

```
User performs an action in the SaaS product
            │
            ▼
  Client fires   POST /api/events
            │
            ▼
  EventService.recordEvent()
   ├── Validates accountId + userId exist
   ├── Inserts row into events table
   └── Calls AlertService.checkThresholds(accountId, feature)
                │
                ▼
   AlertService.checkThresholds()
   ├── Fetches all thresholds for this account + feature
   ├── For each threshold:
   │    └── COUNT events WHERE occurred_at >= NOW() - windowDays
   │         If count >= limitCount:
   │           → Insert into triggered_alerts
   │           → (Future: send email/webhook notification)
   └── Returns
            │
            ▼
  Client calls   GET /api/insights?groupBy=day
            │
            ▼
  InsightService.getInsights()
   └── Runs GROUP BY query on events table
       Returns aggregated array for chart rendering
```

### Alert Notification Strategy (Current vs Future)

| Phase | Behaviour |
|---|---|
| **Now (Demo)** | Threshold breaches written to `triggered_alerts` table; client polls the alert history endpoint |
| **Month 1–3** | Add a background job (cron or queue) that sends email via Nodemailer |
| **Month 3–6+** | Replace cron with a message queue (e.g. BullMQ / SQS); support webhooks per account |

---

## 6. Scaling & Evolution Strategy

### Phase 1 — First 1–3 Months (Current Design)

- **Single PostgreSQL instance** — sufficient for early SaaS scale.
- **Real-time aggregation** — `GROUP BY` queries on raw `events` table per request.
- **Synchronous threshold checks** — checked inline on each event ingestion.
- **No caching** — keep it simple, all reads hit Postgres.
- **Vertical scaling** — upgrade DB instance size as needed.

> ✅ Fast to build, easy to reason about, good enough for thousands of events/day.

### Phase 2 — 3–6 Months (As Load Grows)

- **Pre-aggregation**: Add a daily cron job that writes to a `daily_event_counts` summary table. Insights queries hit the summary table instead of the raw events table.
- **Indexing**: Additional composite indexes on `(account_id, feature, occurred_at)`.
- **Connection pooling**: Add `pg-pool` or `pgBouncer` to handle concurrent connections.
- **Alert queue**: Move threshold checks out of the request lifecycle into a lightweight job queue (BullMQ).
- **Email notifications**: Integrate Nodemailer or SendGrid triggered from the alert queue.

### Phase 3 — 6+ Months (High Scale)

- **Separate read replica** for analytics queries (insights endpoint).
- **Time-series DB** consideration: Migrate events table to TimescaleDB (a Postgres extension) for efficient time-range queries at millions of rows.
- **Rate limiting** on the ingest endpoint to prevent abuse.
- **Webhook support** per account for real-time alert delivery.

---

## 7. Project Structure

```
datamatic/
├── backend/
│   ├── src/
│   │   ├── index.js                  ← Express app entry point
│   │   ├── db.js                     ← PostgreSQL pool setup
│   │   ├── routes/
│   │   │   ├── events.js             ← POST /api/events
│   │   │   ├── insights.js           ← GET  /api/insights
│   │   │   └── alerts.js             ← POST/GET/DELETE /api/alerts/*
│   │   ├── services/
│   │   │   ├── eventService.js       ← Record event + trigger alert check
│   │   │   ├── insightService.js     ← Aggregation queries
│   │   │   └── alertService.js       ← Threshold evaluation logic
│   │   └── middleware/
│   │       └── validate.js           ← Request validation helper
│   ├── migrations/
│   │   └── 001_init.sql              ← All CREATE TABLE statements
│   └── tests/
│       ├── events.test.js
│       └── alerts.test.js
│
└── frontend/
    └── src/
        ├── api/
        │   └── client.js             ← Axios wrapper
        ├── pages/
        │   └── InsightsPage.jsx      ← Main dashboard page
        └── components/
            ├── UsageChart.jsx        ← Recharts bar chart
            ├── AlertsPanel.jsx       ← Triggered alerts list
            └── ThresholdForm.jsx     ← Create/manage threshold rules
```

---

## 8. Code Slice (What Will Be Implemented)

The following represents the "narrow slice" that proves the full flow end-to-end:

| Layer | What's built |
|---|---|
| **Migration** | `001_init.sql` — all 5 tables |
| **Backend** | `POST /api/events` — validate, persist, check thresholds |
| **Backend** | `GET /api/insights` — aggregate by day/feature/user |
| **Backend** | `GET/POST /api/alerts/thresholds` — CRUD threshold rules |
| **Backend** | `GET /api/alerts/triggered` — alert history |
| **Tests** | Unit tests for `eventService` and `alertService` |
| **Frontend** | `InsightsPage` — bar chart showing usage by day |
| **Frontend** | `AlertsPanel` — shows triggered alerts |
| **Frontend** | `ThresholdForm` — create a new threshold rule |

---

> **Note on simplifications (intentional for demo scope):**
> - `accountId` and `userId` are passed in from the client (no JWT auth). In production these would come from a decoded auth token.
> - Alert notifications are stored in the DB only — no actual emails are sent.
> - No pagination on list endpoints.
