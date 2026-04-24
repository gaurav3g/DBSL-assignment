/**
 * Tests for POST /api/events
 *
 * We mock the database pool so these tests run without a real PostgreSQL
 * instance (fast, isolated unit tests).
 */

// ── Mock pg pool ──────────────────────────────────────────────────────────────
jest.mock('../src/db', () => {
  const mockPool = {
    query: jest.fn(),
  };
  return mockPool;
});

// ── Mock alertService so threshold checks don't run in event tests ────────────
jest.mock('../src/services/alertService', () => ({
  checkThresholds: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app     = require('../src/index');
const pool    = require('../src/db');

const VALID_PAYLOAD = {
  accountId: 'a0000000-0000-0000-0000-000000000001',
  userId:    'b0000000-0000-0000-0000-000000000001',
  feature:   'dashboard',
  action:    'view',
};

describe('POST /api/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 and event id on valid payload', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 'evt-001', ...VALID_PAYLOAD, metadata: null, occurred_at: new Date() }],
    });

    const res = await request(app).post('/api/events').send(VALID_PAYLOAD);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 'evt-001');
    expect(res.body).toHaveProperty('message', 'Event recorded');
  });

  it('returns 400 when accountId is missing', async () => {
    const { accountId, ...body } = VALID_PAYLOAD;
    const res = await request(app).post('/api/events').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/accountId/);
  });

  it('returns 400 when feature is missing', async () => {
    const { feature, ...body } = VALID_PAYLOAD;
    const res = await request(app).post('/api/events').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/feature/);
  });

  it('returns 400 when action is missing', async () => {
    const { action, ...body } = VALID_PAYLOAD;
    const res = await request(app).post('/api/events').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/action/);
  });

  it('calls pool.query with the correct SQL', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 'evt-002', ...VALID_PAYLOAD, metadata: null, occurred_at: new Date() }],
    });

    await request(app).post('/api/events').send(VALID_PAYLOAD);

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO events/i);
    expect(params).toContain(VALID_PAYLOAD.accountId);
    expect(params).toContain(VALID_PAYLOAD.feature);
  });

  it('includes optional metadata in the insert', async () => {
    const payloadWithMeta = { ...VALID_PAYLOAD, metadata: { page: 'home' } };

    pool.query.mockResolvedValueOnce({
      rows: [{ id: 'evt-003', ...payloadWithMeta, occurred_at: new Date() }],
    });

    const res = await request(app).post('/api/events').send(payloadWithMeta);
    expect(res.status).toBe(201);

    const [, params] = pool.query.mock.calls[0];
    expect(params).toContainEqual({ page: 'home' });
  });

  it('returns 500 when the database throws', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection lost'));

    const res = await request(app).post('/api/events').send(VALID_PAYLOAD);
    expect(res.status).toBe(500);
  });
});
