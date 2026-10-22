const jwt = require('jsonwebtoken');

module.exports = function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET || 'letsgo_super_secret_jwt_key_2026_uom_ite2953'
    );
    req.admin = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};
