const express      = require('express');
const { validate } = require('../middleware/validate');
const alertService = require('../services/alertService');

const router = express.Router();

// ── Thresholds ────────────────────────────────────────────────────────────────

/**
 * GET /api/alerts/thresholds?accountId=...
 * List all threshold rules for an account.
 */
router.get('/thresholds', async (req, res, next) => {
  try {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: 'Missing required query param: accountId' });

    const thresholds = await alertService.getThresholds(accountId);
    res.json(thresholds);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/alerts/thresholds
 * Create a new threshold rule.
 *
 * Body: { accountId, feature, windowDays, limitCount }
 */
router.post(
  '/thresholds',
  validate(['accountId', 'feature', 'windowDays', 'limitCount']),
  async (req, res, next) => {
    try {
      const { accountId, feature, windowDays, limitCount } = req.body;
      const threshold = await alertService.createThreshold({
        accountId,
        feature,
        windowDays: parseInt(windowDays, 10),
        limitCount: parseInt(limitCount, 10),
      });
      res.status(201).json(threshold);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/alerts/thresholds/:id
 * Remove a threshold rule by ID.
 */
router.delete('/thresholds/:id', async (req, res, next) => {
  try {
    const deleted = await alertService.deleteThreshold(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Threshold not found' });
    res.json({ message: 'Threshold deleted', id: deleted.id });
  } catch (err) {
    next(err);
  }
});

// ── Triggered Alerts ──────────────────────────────────────────────────────────

/**
 * GET /api/alerts/triggered?accountId=...
 * Returns alert history for an account.
 */
router.get('/triggered', async (req, res, next) => {
  try {
    const { accountId } = req.query;
    if (!accountId) return res.status(400).json({ error: 'Missing required query param: accountId' });

    const alerts = await alertService.getTriggeredAlerts(accountId);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
