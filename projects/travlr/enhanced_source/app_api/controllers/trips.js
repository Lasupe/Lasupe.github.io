const mongoose = require('mongoose');
const { validateTrip } = require('../middleware/validation');
const Trip = mongoose.model('Trip');
module.exports.tripsList = async (req, res, next) => {
  try { res.status(200).json(await Trip.find({})); } catch (error) { next(error); }
};
module.exports.tripsFindById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.status(200).json(trip);
  } catch (error) { next(error); }
};
module.exports.tripAdd = async (req, res, next) => {
  const checked = validateTrip(req.body);
  if (checked.error) return res.status(400).json({ message: checked.error });
  try { res.status(201).json(await Trip.create(checked.value)); } catch (error) { next(error); }
};
module.exports.tripUpdateOne = async (req, res, next) => {
  const checked = validateTrip(req.body);
  if (checked.error) return res.status(400).json({ message: checked.error });
  try {
    const trip = await Trip.findByIdAndUpdate(req.params.tripId, { $set: checked.value }, { new: true, runValidators: true });
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.status(200).json(trip);
  } catch (error) { next(error); }
};
module.exports.tripDeleteOne = async (req, res, next) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.status(204).end();
  } catch (error) { next(error); }
};
