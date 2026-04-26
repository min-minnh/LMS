const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['vocab', 'lesson', 'general'], default: 'general' }
}, { timestamps: true });

module.exports = mongoose.model('Topic', topicSchema);
