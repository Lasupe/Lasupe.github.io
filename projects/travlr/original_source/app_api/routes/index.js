const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const ctrlTrips = require('../controllers/trips');
const ctrlAuth = require('../controllers/authentication');

function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.split(' ')[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'travlr_secret');
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/* Public routes */
router.get('/trips', ctrlTrips.tripsList);
router.get('/trips/:tripId', ctrlTrips.tripsFindById);

router.post('/register', ctrlAuth.register);
router.post('/login', ctrlAuth.login);

/* Protected admin routes */
router.post('/trips', auth, ctrlTrips.tripAdd);
router.put('/trips/:tripId', auth, ctrlTrips.tripUpdateOne);
router.delete('/trips/:tripId', auth, ctrlTrips.tripDeleteOne);

module.exports = router;