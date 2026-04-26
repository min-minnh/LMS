const mongoose = require('mongoose')

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  score: Number,
  total: Number,
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Result', resultSchema)
