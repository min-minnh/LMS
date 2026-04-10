const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String }, // optional upload target via multer
  fileUrl: { type: String }, // optional attached document file
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
