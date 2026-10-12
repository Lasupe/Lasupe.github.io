const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = mongoose.model('User');

const sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

module.exports.register = function(req, res) {
  if (!req.body.name || !req.body.email || !req.body.password) {
    return sendJSONresponse(res, 400, {
      message: 'All fields required'
    });
  }

  const user = new User();
  user.name = req.body.name;
  user.email = req.body.email;
  user.setPassword(req.body.password);

  user.save()
    .then(() => {
      const token = jwt.sign(
        { email: user.email, name: user.name },
        process.env.JWT_SECRET || 'travlr_secret',
        { expiresIn: '1h' }
      );

      sendJSONresponse(res, 200, {
        token: token
      });
    })
    .catch((err) => {
      sendJSONresponse(res, 400, err);
    });
};

module.exports.login = function(req, res) {
  if (!req.body.email || !req.body.password) {
    return sendJSONresponse(res, 400, {
      message: 'All fields required'
    });
  }

  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return sendJSONresponse(res, 401, {
          message: 'Authentication failed'
        });
      }

      if (!user.validPassword(req.body.password)) {
        return sendJSONresponse(res, 401, {
          message: 'Authentication failed'
        });
      }

      const token = jwt.sign(
        { email: user.email, name: user.name },
        process.env.JWT_SECRET || 'travlr_secret',
        { expiresIn: '1h' }
      );

      sendJSONresponse(res, 200, {
        token: token
      });
    })
    .catch((err) => {
      sendJSONresponse(res, 500, err);
    });
};