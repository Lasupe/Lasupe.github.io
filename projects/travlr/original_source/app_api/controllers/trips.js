const mongoose = require('mongoose');
const Trip = mongoose.model('Trip');

// GET all trips
module.exports.tripsList = function (req, res) {
  Trip.find({})
    .then((trips) => {
      res.status(200).json(trips);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
};

// GET one trip by ID
module.exports.tripsFindById = function (req, res) {
  Trip.findById(req.params.tripId)
    .then((trip) => {
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      res.status(200).json(trip);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
};

module.exports.tripAdd = function (req, res) {
  Trip.create({
    code: req.body.code,
    name: req.body.name,
    length: req.body.length,
    start: req.body.start,
    resort: req.body.resort,
    perPerson: req.body.perPerson,
    image: req.body.image,
    description: req.body.description
  })
    .then((trip) => {
      res.status(201).json(trip);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
};

module.exports.tripUpdateOne = function (req, res) {
  Trip.findById(req.params.tripId)
    .then((trip) => {
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }

      trip.code = req.body.code;
      trip.name = req.body.name;
      trip.length = req.body.length;
      trip.start = req.body.start;
      trip.resort = req.body.resort;
      trip.perPerson = req.body.perPerson;
      trip.image = req.body.image;
      trip.description = req.body.description;

      return trip.save();
    })
    .then((updatedTrip) => {
      if (updatedTrip) {
        res.status(200).json(updatedTrip);
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
};

module.exports.tripDeleteOne = function (req, res) {
  Trip.findByIdAndDelete(req.params.tripId)
    .then((trip) => {
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      res.status(204).json(null);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
};