const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  passage: { type: String, default: '' }, // optional reading passage
  question: { type: String, required: true },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true },
  optionC: { type: String, required: true },
  optionD: { type: String, required: true },
  correct: { type: String, enum: ['A', 'B', 'C', 'D'], required: true }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  timeLimit: { type: Number, required: true }, // in seconds
  attemptLimit: { type: Number, default: 0 }, // 0 = unlimited
  questionCount: { type: Number, default: 0 },
  shuffleQuestions: { type: Boolean, default: false },
  questions: [questionSchema]
}, { timestamps: true });

// Pre-save middleware to auto-update questionCount
quizSchema.pre('save', function () {
  this.questionCount = this.questions ? this.questions.length : 0;
});

module.exports = mongoose.model('Quiz', quizSchema);
