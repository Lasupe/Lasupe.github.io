require('./db');
const mongoose = require('mongoose');
const Trip = mongoose.model('Trip');

const trips = [
  {
    code: 'HAW001',
    name: 'Hawaii Adventure',
    length: '7 nights',
    start: new Date('2026-06-15'),
    resort: 'Waikiki Beach Resort',
    perPerson: '$1200',
    image: 'images/sea-sound.jpg',
    description: 'Enjoy beaches and sunshine.'
  },
  {
    code: 'NYC002',
    name: 'New York City Escape',
    length: '5 nights',
    start: new Date('2026-07-10'),
    resort: 'Manhattan Central Hotel',
    perPerson: '$900',
    image: 'images/rooms.png',
    description: 'Explore the city and famous landmarks.'
  },
  {
    code: 'MNT003',
    name: 'Mountain Retreat',
    length: '4 nights',
    start: new Date('2026-08-05'),
    resort: 'Blue Ridge Lodge',
    perPerson: '$750',
    image: 'images/dive-site.png',
    description: 'Relax in a peaceful mountain setting.'
  }
];

Trip.deleteMany({})
  .then(() => Trip.insertMany(trips))
  .then(() => {
    console.log('Database seeded successfully');
    mongoose.connection.close();
  })
  .catch((err) => {
    console.log('Seeding error:', err);
    mongoose.connection.close();
  });