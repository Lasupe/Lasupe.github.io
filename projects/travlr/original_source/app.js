require('./app_server/models/db');
const express = require('express');
const path = require('path');
const hbs = require('hbs');
const cors = require('cors');

const app = express();

app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'hbs');

hbs.registerPartials(path.join(__dirname, 'app_server', 'views', 'partials'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const routes = require('./app_server/routes/index');
const apiRoutes = require('./app_api/routes/index');

app.use('/', routes);
app.use('/api', apiRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});