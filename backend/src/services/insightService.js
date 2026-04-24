const pool = require('../db');

const VALID_GROUP_BY = ['day', 'feature', 'user'];

/**
 * Return aggregated event counts for charts.
 *
 * @param {object} options
 * @param {string}  options.accountId
 * @param {string}  options.groupBy   - 'day' | 'feature' | 'user'
 * @param {string}  [options.from]    - ISO date (default: 30 days ago)
 * @param {string}  [options.to]      - ISO date (default: now)
 * @param {string}  [options.feature] - narrow to a single feature
 *
 * @returns {Promise<{ groupBy: string, data: Array<{ label: string, count: number }> }>}
 */
async function getInsights({ accountId, groupBy, from, to, feature }) {
  if (!VALID_GROUP_BY.includes(groupBy)) {
    const err = new Error(`Invalid groupBy. Must be one of: ${VALID_GROUP_BY.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const toDate   = to   || new Date().toISOString();

  let selectExpr, groupExpr;

  if (groupBy === 'day') {
    selectExpr = `TO_CHAR(occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
    groupExpr  = selectExpr;
  } else if (groupBy === 'feature') {
    selectExpr = `feature`;
    groupExpr  = `feature`;
  } else {
    // 'user' – group by user_id, show user name if possible
    selectExpr = `u.name`;
    groupExpr  = `u.name`;
  }

  const params = [accountId, fromDate, toDate];
  const featureClause = feature ? `AND e.feature = $${params.push(feature)}` : '';

  let query;
  if (groupBy === 'user') {
    query = `
      SELECT ${selectExpr} AS label, COUNT(*) AS count
      FROM events e
      JOIN users u ON u.id = e.user_id
      WHERE e.account_id = $1
        AND e.occurred_at BETWEEN $2 AND $3
        ${featureClause}
      GROUP BY ${groupExpr}
      ORDER BY count DESC
    `;
  } else {
    query = `
      SELECT ${selectExpr} AS label, COUNT(*) AS count
      FROM events e
      WHERE e.account_id = $1
        AND e.occurred_at BETWEEN $2 AND $3
        ${featureClause}
      GROUP BY ${groupExpr}
      ORDER BY label ASC
    `;
  }

  const { rows } = await pool.query(query, params);

  return {
    groupBy,
    data: rows.map((r) => ({ label: r.label, count: parseInt(r.count, 10) })),
  };
}

module.exports = { getInsights };
