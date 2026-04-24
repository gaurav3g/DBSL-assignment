const pool = require('../db');

/**
 * Fetch all threshold rules for an account.
 */
async function getThresholds(accountId) {
  const result = await pool.query(
    `SELECT id, account_id, feature, window_days, limit_count, created_at
     FROM thresholds
     WHERE account_id = $1
     ORDER BY created_at DESC`,
    [accountId]
  );
  return result.rows;
}

/**
 * Create a new threshold rule.
 */
async function createThreshold({ accountId, feature, windowDays, limitCount }) {
  const result = await pool.query(
    `INSERT INTO thresholds (account_id, feature, window_days, limit_count)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [accountId, feature, windowDays, limitCount]
  );
  return result.rows[0];
}

/**
 * Delete a threshold by its ID.
 * Returns the deleted row (or null if not found).
 */
async function deleteThreshold(id) {
  const result = await pool.query(
    `DELETE FROM thresholds WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

/**
 * Get alert history for an account.
 */
async function getTriggeredAlerts(accountId) {
  const result = await pool.query(
    `SELECT ta.id,
            ta.feature,
            ta.event_count,
            ta.triggered_at,
            t.limit_count,
            t.window_days
     FROM triggered_alerts ta
     JOIN thresholds t ON t.id = ta.threshold_id
     WHERE ta.account_id = $1
     ORDER BY ta.triggered_at DESC`,
    [accountId]
  );
  return result.rows;
}

/**
 * Core threshold evaluation logic.
 *
 * For each threshold defined for the given account + feature:
 *   1. Count events in the rolling window.
 *   2. If the count >= limit_count, write a triggered_alert row.
 *
 * Called automatically after every event ingestion.
 */
async function checkThresholds(accountId, feature) {
  // Fetch all threshold rules that match this account + feature
  const { rows: rules } = await pool.query(
    `SELECT id, window_days, limit_count
     FROM thresholds
     WHERE account_id = $1 AND feature = $2`,
    [accountId, feature]
  );

  for (const rule of rules) {
    const { rows: countResult } = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM events
       WHERE account_id = $1
         AND feature    = $2
         AND occurred_at >= NOW() - ($3 || ' days')::INTERVAL`,
      [accountId, feature, rule.window_days]
    );

    const count = parseInt(countResult[0].cnt, 10);

    if (count >= rule.limit_count) {
      await pool.query(
        `INSERT INTO triggered_alerts (threshold_id, account_id, feature, event_count)
         VALUES ($1, $2, $3, $4)`,
        [rule.id, accountId, feature, count]
      );

      console.log(
        `[Alert] Feature "${feature}" hit ${count}/${rule.limit_count} events ` +
        `(window: ${rule.window_days}d) for account ${accountId}`
      );
    }
  }
}

module.exports = {
  getThresholds,
  createThreshold,
  deleteThreshold,
  getTriggeredAlerts,
  checkThresholds,
};
