const express        = require('express');
const insightService = require('../services/insightService');

const router = express.Router();

/**
 * GET /api/insights
 * Returns aggregated event data for charts.
 *
 * Query params:
 *   accountId  (required)
 *   groupBy    (required) – day | feature | user
 *   from       (optional) – ISO date
 *   to         (optional) – ISO date
 *   feature    (optional) – filter to a specific feature
 */
router.get('/', async (req, res, next) => {
  try {
    const { accountId, groupBy, from, to, feature } = req.query;

    if (!accountId) return res.status(400).json({ error: 'Missing required query param: accountId' });
    if (!groupBy)   return res.status(400).json({ error: 'Missing required query param: groupBy' });

    const result = await insightService.getInsights({ accountId, groupBy, from, to, feature });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
