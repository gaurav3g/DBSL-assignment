/**
 * Simple request body validator.
 * Returns a 400 response if any required field is missing or empty.
 *
 * Usage:
 *   router.post('/', validate(['accountId', 'userId', 'feature']), handler)
 */
function validate(requiredFields) {
  return (req, res, next) => {
    for (const field of requiredFields) {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }
    next();
  };
}

module.exports = { validate };
