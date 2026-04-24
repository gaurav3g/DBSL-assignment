/**
 * Tests for alertService – threshold CRUD and checkThresholds logic.
 *
 * The pg pool is mocked so these run in isolation without a real database.
 */

jest.mock('../src/db', () => ({ query: jest.fn() }));

const pool         = require('../src/db');
const alertService = require('../src/services/alertService');

const ACCOUNT_ID    = 'a0000000-0000-0000-0000-000000000001';
const THRESHOLD_ID  = 'c0000000-0000-0000-0000-000000000001';

describe('alertService.createThreshold', () => {
  beforeEach(() => jest.clearAllMocks());

  it('inserts a threshold row and returns it', async () => {
    const threshold = {
      id: THRESHOLD_ID,
      account_id:  ACCOUNT_ID,
      feature:     'export',
      window_days: 1,
      limit_count: 50,
      created_at:  new Date(),
    };
    pool.query.mockResolvedValueOnce({ rows: [threshold] });

    const result = await alertService.createThreshold({
      accountId:   ACCOUNT_ID,
      feature:     'export',
      windowDays:  1,
      limitCount:  50,
    });

    expect(result).toMatchObject({ feature: 'export', limit_count: 50 });
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO thresholds/i);
    expect(params).toContain(ACCOUNT_ID);
    expect(params).toContain('export');
  });
});

describe('alertService.deleteThreshold', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the deleted row when it exists', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: THRESHOLD_ID }] });
    const result = await alertService.deleteThreshold(THRESHOLD_ID);
    expect(result).toHaveProperty('id', THRESHOLD_ID);
  });

  it('returns null when threshold does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const result = await alertService.deleteThreshold('non-existent-id');
    expect(result).toBeNull();
  });
});

describe('alertService.checkThresholds', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does nothing when there are no threshold rules', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // no thresholds for account+feature
    await alertService.checkThresholds(ACCOUNT_ID, 'export');
    // Only one query (fetch thresholds) should have run
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire an alert when count is below the limit', async () => {
    // 1st query: fetch matching thresholds
    pool.query.mockResolvedValueOnce({
      rows: [{ id: THRESHOLD_ID, window_days: 1, limit_count: 100 }],
    });
    // 2nd query: count events (below limit)
    pool.query.mockResolvedValueOnce({ rows: [{ cnt: '40' }] });

    await alertService.checkThresholds(ACCOUNT_ID, 'export');

    // 2 queries total: fetch thresholds + count – no INSERT
    expect(pool.query).toHaveBeenCalledTimes(2);
    const calls = pool.query.mock.calls.map(([sql]) => sql);
    expect(calls.some((s) => /INSERT INTO triggered_alerts/i.test(s))).toBe(false);
  });

  it('fires an alert when count equals the limit', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: THRESHOLD_ID, window_days: 1, limit_count: 100 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [{ cnt: '100' }] });
    pool.query.mockResolvedValueOnce({ rows: [] }); // INSERT triggered_alerts

    await alertService.checkThresholds(ACCOUNT_ID, 'export');

    // 3 queries: fetch thresholds + count + insert alert
    expect(pool.query).toHaveBeenCalledTimes(3);
    const insertCall = pool.query.mock.calls[2][0];
    expect(insertCall).toMatch(/INSERT INTO triggered_alerts/i);
  });

  it('fires an alert when count exceeds the limit', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: THRESHOLD_ID, window_days: 7, limit_count: 50 }],
    });
    pool.query.mockResolvedValueOnce({ rows: [{ cnt: '75' }] });
    pool.query.mockResolvedValueOnce({ rows: [] });

    await alertService.checkThresholds(ACCOUNT_ID, 'dashboard');

    const insertParams = pool.query.mock.calls[2][1];
    expect(insertParams).toContain(75); // event_count stored correctly
    expect(insertParams).toContain(ACCOUNT_ID);
  });

  it('evaluates multiple thresholds independently', async () => {
    // Two thresholds for same account + feature
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'c1', window_days: 1, limit_count: 10 },
        { id: 'c2', window_days: 7, limit_count: 100 },
      ],
    });
    pool.query.mockResolvedValueOnce({ rows: [{ cnt: '15' }] }); // threshold 1 hit
    pool.query.mockResolvedValueOnce({ rows: [] });               // insert alert 1
    pool.query.mockResolvedValueOnce({ rows: [{ cnt: '40' }] }); // threshold 2 not hit

    await alertService.checkThresholds(ACCOUNT_ID, 'export');

    // 4 queries: fetch + (count + insert) for threshold1 + count for threshold2
    expect(pool.query).toHaveBeenCalledTimes(4);
  });
});
