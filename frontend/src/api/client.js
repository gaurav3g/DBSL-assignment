import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Hardcoded for demo – in production this would come from auth token
export const DEMO_ACCOUNT_ID = 'a0000000-0000-0000-0000-000000000001';
export const DEMO_USER_ID    = 'b0000000-0000-0000-0000-000000000001';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Events ────────────────────────────────────────────────────────────────────
export const ingestEvent = (data) =>
  client.post('/events', data).then((r) => r.data);

// ── Insights ──────────────────────────────────────────────────────────────────
export const getInsights = (params) =>
  client.get('/insights', { params }).then((r) => r.data);

// ── Thresholds ────────────────────────────────────────────────────────────────
export const getThresholds = (accountId) =>
  client.get('/alerts/thresholds', { params: { accountId } }).then((r) => r.data);

export const createThreshold = (data) =>
  client.post('/alerts/thresholds', data).then((r) => r.data);

export const deleteThreshold = (id) =>
  client.delete(`/alerts/thresholds/${id}`).then((r) => r.data);

// ── Triggered Alerts ──────────────────────────────────────────────────────────
export const getTriggeredAlerts = (accountId) =>
  client.get('/alerts/triggered', { params: { accountId } }).then((r) => r.data);

export default client;
