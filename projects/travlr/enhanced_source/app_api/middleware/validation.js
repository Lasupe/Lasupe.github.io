const mongoose = require('mongoose');
const fields = ['code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'];
function validateTrip(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Trip must be an object' };
  const unexpected = Object.keys(body).filter(key => !fields.includes(key) && key !== '_id' && key !== '__v');
  if (unexpected.length) return { error: 'Unexpected trip fields: ' + unexpected.join(', ') };
  const result = {};
  for (const key of fields) {
    if (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > (key === 'description' ? 5000 : 250))
      return { error: `Invalid ${key}: nonempty string required` };
    result[key] = body[key].trim();
  }
  if (Number.isNaN(Date.parse(result.start))) return { error: 'Invalid start date' };
  if (!/^https?:\/\//i.test(result.image) && !/^[a-z0-9_.-]+$/i.test(result.image)) return { error: 'Invalid image reference' };
  return { value: result };
}
function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.tripId)) return res.status(400).json({ message: 'Invalid trip ID' });
  next();
}
module.exports = { validateTrip, validId };
