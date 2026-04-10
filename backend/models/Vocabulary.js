const mongoose = require('mongoose');

const vocabularySchema = new mongoose.Schema({
  word: { type: String, required: true },
  meaning: { type: String, required: true },
  example: { type: String },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Vocabulary', vocabularySchema);
