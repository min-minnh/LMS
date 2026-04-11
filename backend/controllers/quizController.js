const Quiz = require('../models/Quiz');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { parseXLSX } = require('../utils/csvParser');
const fs = require('fs');

exports.create = async (req, res) => {
  try {
    const { title, description, timeLimit, attemptLimit, shuffleQuestions } = req.body;
    const quiz = await Quiz.create({ title, description, timeLimit, attemptLimit: attemptLimit || 0, shuffleQuestions: shuffleQuestions !== false });
    return sendSuccess(res, 'Quiz created', quiz, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const quizzes = await Quiz.find().select('-questions').skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Quiz.countDocuments();
    return sendSuccess(res, 'Success', { quizzes, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return sendError(res, 'Quiz not found', 404);
    return sendSuccess(res, 'Success', quiz);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { title, description, timeLimit, attemptLimit, shuffleQuestions } = req.body;
    const updateFields = { title, description, timeLimit };
    if (attemptLimit !== undefined) updateFields.attemptLimit = attemptLimit;
    if (shuffleQuestions !== undefined) updateFields.shuffleQuestions = shuffleQuestions;
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!quiz) return sendError(res, 'Quiz not found', 404);
    return sendSuccess(res, 'Quiz updated', quiz);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return sendError(res, 'Quiz not found', 404);
    return sendSuccess(res, 'Quiz deleted', quiz);
  } catch (err) {
    return sendError(res, err.message);
  }
};

// Questions Management
exports.addQuestion = async (req, res) => {
  try {
    const { passage, question, optionA, optionB, optionC, optionD, correct } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return sendError(res, 'Quiz not found', 404);

    quiz.questions.push({ passage: passage || '', question, optionA, optionB, optionC, optionD, correct });
    await quiz.save();
    return sendSuccess(res, 'Question added', quiz, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { passage, question, optionA, optionB, optionC, optionD, correct } = req.body;
    const { id, qId } = req.params;
    const quiz = await Quiz.findOneAndUpdate(
      { _id: id, 'questions._id': qId },
      { $set: { 
          'questions.$.passage': passage || '',
          'questions.$.question': question,
          'questions.$.optionA': optionA,
          'questions.$.optionB': optionB,
          'questions.$.optionC': optionC,
          'questions.$.optionD': optionD,
          'questions.$.correct': correct
        } 
      },
      { new: true }
    );
    if (!quiz) return sendError(res, 'Quiz or Question not found', 404);
    
    // trigger auto save hook to re-calc count if needed
    await quiz.save();
    return sendSuccess(res, 'Question updated', quiz);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.removeQuestion = async (req, res) => {
  try {
    const { id, qId } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) return sendError(res, 'Quiz not found', 404);

    quiz.questions = quiz.questions.filter(q => q._id.toString() !== qId);
    await quiz.save();
    return sendSuccess(res, 'Question removed', quiz);
  } catch (err) {
    return sendError(res, err.message);
  }
};

// CSV upload
exports.uploadCSV = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);
    if (!quiz) return sendError(res, 'Quiz not found', 404);

    let data = [];
    
    // Support direct CSV text payload
    if (req.body.csvText) {
      const lines = req.body.csvText.split('\n');
      if (lines.length > 0) {
        let headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const colStr = lines[i].trim();
          if (!colStr) continue;
          
          const cols = colStr.split(',').map(c => c.trim());
          let obj = {};
          headers.forEach((h, idx) => {
            if (h) obj[h] = cols[idx] || '';
          });
          data.push(obj);
        }
      }
    } else {
      const file = req.file;
      if (!file) return sendError(res, 'Please upload a CSV file or paste content', 400);
      data = await parseXLSX(file.path);
    }
    let successCount = 0;
    let errorRows = [];

    const validOptions = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowIndex = i + 2; 

        const passage = (row.passage || '').toString().trim();
        const question = (row.question || '').toString().trim();
        const optionA = (row.optionA || '').toString().trim();
        const optionB = (row.optionB || '').toString().trim();
        const optionC = (row.optionC || '').toString().trim();
        const optionD = (row.optionD || '').toString().trim();
        const correct = (row.correct || row.correctAnswer || '').toString().trim().toUpperCase();

        if (!question || !optionA || !optionB || !optionC || !optionD || !correct) {
          errorRows.push({ row: rowIndex, reason: 'Missing required question fields' });
          continue;
        }

        if (!validOptions.includes(correct)) {
          errorRows.push({ row: rowIndex, reason: 'Correct answer must be A, B, C, or D' });
          continue;
        }

        quiz.questions.push({ passage, question, optionA, optionB, optionC, optionD, correct });
        successCount++;
    }

    await quiz.save();
    if (req.file) fs.unlinkSync(req.file.path);

    return sendSuccess(res, 'Questions imported', { successCount, errorRows });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    return sendError(res, err.message);
  }
};
