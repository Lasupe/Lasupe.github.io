const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { secret } = require('../middleware/auth');
const User = mongoose.model('User');
function tokenFor(user) { return jwt.sign({ role: user.role }, secret(), { algorithm: 'HS256', subject: String(user._id), expiresIn: '1h' }); }
module.exports.register = async function(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 12)
      return res.status(400).json({ message: 'Provide name, valid email, and password of at least 12 characters' });
    const user = new User({ name: name.trim(), email: email.trim().toLowerCase(), role: 'user' });
    user.setPassword(password);
    await user.save();
    return res.status(201).json({ token: tokenFor(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email already registered' });
    next(error);
  }
};
module.exports.login = async function(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ message: 'Email and password required' });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !user.validPassword(password)) return res.status(401).json({ message: 'Authentication failed' });
    return res.status(200).json({ token: tokenFor(user) });
  } catch (error) { next(error); }
};
