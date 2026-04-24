const pool        = require('../db');
const alertService = require('./alertService');

/**
 * Persist a single event and then evaluate alert thresholds.
 *
 * @param {object} data
 * @param {string} data.accountId
 * @param {string} data.userId
 * @param {string} data.feature   - e.g. "dashboard", "export"
 * @param {string} data.action    - e.g. "view", "click"
 * @param {object} [data.metadata]
 * @returns {Promise<object>} the created event row
 */
async function recordEvent({ accountId, userId, feature, action, metadata = null }) {
  const result = await pool.query(
    `INSERT INTO events (account_id, user_id, feature, action, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, account_id, user_id, feature, action, metadata, occurred_at`,
    [accountId, userId, feature, action, metadata]
  );

  const event = result.rows[0];

  // After persisting the event, check if any thresholds have been crossed.
  // We do this asynchronously (fire-and-forget) so the HTTP response is fast.
  alertService.checkThresholds(accountId, feature).catch((err) => {
    console.error('Alert check failed:', err.message);
  });

  return event;
}

module.exports = { recordEvent };
