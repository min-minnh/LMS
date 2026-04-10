const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selected: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true }, // computed at submit time
  total: { type: Number, required: true }, // original total questions
  answers: [answerSchema],
  startTime: { type: Date, required: true },
  submittedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
