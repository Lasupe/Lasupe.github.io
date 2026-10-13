const jwt = require('jsonwebtoken');
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return value;
}
function authenticate(req, res, next) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.status(401).json({ message: 'Authentication required' });
  try {
    const claims = jwt.verify(match[1], secret(), { algorithms: ['HS256'] });
    if (!claims.sub) return res.status(401).json({ message: 'Invalid token' });
    req.user = claims;
    return next();
  } catch (error) {
    if (error.message.startsWith('JWT_SECRET')) return next(error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required' });
  next();
}
module.exports = { secret, authenticate, requireAdmin };
