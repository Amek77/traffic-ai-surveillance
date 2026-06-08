const mongoose = require('mongoose');

const ViolationSchema = new mongoose.Schema({
  image_id: {
    type: String,
    required: [true, 'Image ID is required']
  },
  image_path: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  plate_number: {
    type: String,
    default: 'NOT FOUND'
  },
  helmet: {
    type: Boolean,
    default: false
  },
  triple_riding: {
    type: Boolean,
    default: false
  },
  hsrp_status: {
    type: String,
    enum: ['hsrp', 'non-hsrp', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  violations: {
    type: [String],
    default: []
  },
  severity: {
    type: String,
    enum: ['NONE', 'LOW', 'MEDIUM', 'HIGH'],
    default: 'NONE'
  },
  confidence: {
    type: Number,
    default: 0
  },
  detections: {
    type: Array,
    default: []
  },
  frame_id: {
    type: Number,
    default: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Violation', ViolationSchema);
