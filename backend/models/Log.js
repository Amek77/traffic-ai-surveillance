const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  image_id: {
    type: String
  },
  action: {
    type: String,
    required: [true, 'Action is required']
  },
  details: {
    type: mongoose.Schema.Types.Map,
    of: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Log', LogSchema);
