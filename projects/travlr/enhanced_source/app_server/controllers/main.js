const axios = require('axios');
const mongoose = require('mongoose');
const Trip = mongoose.model('Trip');

const apiOptions = {
  server: 'http://localhost:3000'
};

module.exports.index = function (req, res) {
  res.render('index', { title: 'Travlr Getaways' });
};

module.exports.travel = function (req, res) {
  axios.get(`${apiOptions.server}/api/trips`)
    .then((response) => {
      res.render('travel', {
        title: 'Travel',
        trips: response.data
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error retrieving trips');
    });
};

module.exports.rooms = function (req, res) {
  res.render('rooms', { title: 'Rooms' });
};

module.exports.meals = function (req, res) {
  res.render('meals', { title: 'Meals' });
};

module.exports.news = function (req, res) {
  res.render('news', { title: 'News' });
};

module.exports.about = function (req, res) {
  res.render('about', { title: 'About' });
};

module.exports.contact = function (req, res) {
  res.render('contact', { title: 'Contact' });
};

module.exports.tripList = function (req, res) {
  Trip.find({})
    .then((trips) => {
      res.json(trips);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: 'Error retrieving trip data' });
    });
};

module.exports.tripsFindById = function (req, res) {
  Trip.findById(req.params.tripId)
    .then((trip) => {
      if (!trip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      res.status(200).json(trip);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
};