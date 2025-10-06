const { AuthenticationError } = require('../utils/errors');

const API_KEYS = new Set([
  'prod-api-key-123',
  'test-api-key-456',
  'dev-api-key-789'
]);

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (!apiKey) {
    return next(new AuthenticationError());
  }
  
  // Remove 'Bearer ' prefix if present
  const cleanApiKey = apiKey.replace(/^Bearer\s+/i, '');
  
  if (!API_KEYS.has(cleanApiKey)) {
    return next(new AuthenticationError());
  }
  
  req.apiKey = cleanApiKey;
  next();
};

module.exports = authMiddleware;