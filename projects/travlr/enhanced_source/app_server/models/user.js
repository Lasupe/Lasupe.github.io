const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  hash: { type: String, required: true }
});

userSchema.methods.setPassword = function(password) {
  this.hash = bcrypt.hashSync(password, 10);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.hash);
};

mongoose.model('User', userSchema);