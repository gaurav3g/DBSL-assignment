const express      = require('express');
const { validate } = require('../middleware/validate');
const eventService = require('../services/eventService');

const router = express.Router();

/**
 * POST /api/events
 * Ingest a single user event.
 */
router.post(
  '/',
  validate(['accountId', 'userId', 'feature', 'action']),
  async (req, res, next) => {
    try {
      const { accountId, userId, feature, action, metadata } = req.body;
      const event = await eventService.recordEvent({ accountId, userId, feature, action, metadata });
      res.status(201).json({ id: event.id, message: 'Event recorded' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
