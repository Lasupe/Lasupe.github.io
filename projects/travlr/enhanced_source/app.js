require('./app_server/models/db');
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const cors = require('cors');

const { secret } = require('./app_api/middleware/auth');
secret(); // Fail fast if the signing secret is missing or weak.
const app = express();

app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'hbs');

hbs.registerPartials(path.join(__dirname, 'app_server', 'views', 'partials'));

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const routes = require('./app_server/routes/index');
const apiRoutes = require('./app_api/routes/index');

app.use('/', routes);
app.use('/api', apiRoutes);

app.use('/api', (err, req, res, next) => {
  console.error('API error:', err.message);
  res.status(err.name === 'ValidationError' ? 400 : 500).json({ message: err.name === 'ValidationError' ? 'Invalid data' : 'Internal server error' });
});
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}
module.exports = app;