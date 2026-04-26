const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  question: String,
  options: [String],
  correctAnswer: String
})

module.exports = mongoose.model('Quiz', quizSchema)
