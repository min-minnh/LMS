const Result = require('../models/Result');
const Quiz = require('../models/Quiz');
const { sendSuccess, sendError } = require('../utils/responseHandler');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    // user filter overrides query if not admin, but we expose this to admin usually. 
    // Wait, if it's admin, they can see all. If student, see only theirs.
    if (req.user.role !== 'admin') {
      filter.userId = req.user.id;
    } else {
      if (req.query.userId) filter.userId = req.query.userId;
      if (req.query.quizId) filter.quizId = req.query.quizId;
    }

    const results = await Result.find(filter)
      .populate('userId', 'name email')
      .populate('quizId', 'title')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Result.countDocuments(filter);
    return sendSuccess(res, 'Success', { results, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('quizId');

    if (!result) return sendError(res, 'Result not found', 404);

    const resultUserId = result.userId ? (result.userId._id || result.userId).toString() : null;

    if (req.user.role !== 'admin' && resultUserId !== req.user.id) {
      return sendError(res, 'Unauthorized to view this result', 403);
    }

    return sendSuccess(res, 'Success', result);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return sendError(res, 'Quiz not found', 404);

    // Check attempt limit
    if (quiz.attemptLimit && quiz.attemptLimit > 0) {
      const attemptCount = await Result.countDocuments({ userId: req.user.id, quizId });
      if (attemptCount >= quiz.attemptLimit) {
        return sendError(res, `Bạn đã hết số lượt làm bài cho phép (Tối đa ${quiz.attemptLimit} lượt).`, 403);
      }
    }

    // Create a draft Result
    const result = await Result.create({
      userId: req.user.id,
      quizId,
      score: 0,
      total: quiz.questionCount,
      answers: [],
      startTime: new Date()
    });

    // Shuffle questions before sending to client (conditional)
    let processedQuestions = [...quiz.questions];
    if (quiz.shuffleQuestions !== false) {
      processedQuestions.sort(() => Math.random() - 0.5);
    }

    // Do not leak 'correct' answers down to the client when starting!
    const safeQuiz = {
      _id: quiz._id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      questions: processedQuestions.map(q => ({
        _id: q._id,
        passage: q.passage || '',   // include passage for reading comprehension questions
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD
      }))
    };

    return sendSuccess(res, 'Quiz started', { resultId: result._id, quiz: safeQuiz });
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { resultId, clientAnswers } = req.body;
    // clientAnswers: [{ questionId, selected }]

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return sendError(res, 'Quiz not found', 404);

    const result = await Result.findOne({ _id: resultId, userId: req.user.id, quizId });
    if (!result) return sendError(res, 'Invalid attempt', 400);

    if (result.submittedAt) return sendError(res, 'Quiz already submitted', 400);

    const now = new Date();
    const timeLimitMs = quiz.timeLimit * 1000;
    const diffMs = now - result.startTime;

    // Grace period of 10 seconds due to network latency
    const isLate = diffMs > (timeLimitMs + 10000);

    let score = 0;
    const finalAnswers = [];

    quiz.questions.forEach(q => {
      const dbQid = q._id.toString();
      const ansObj = (clientAnswers || []).find(c => c.questionId === dbQid);

      let isCorrect = false;
      let selected = ansObj ? ansObj.selected : null;

      if (!isLate && selected && selected.toUpperCase() === q.correct.toUpperCase()) {
        isCorrect = true;
        score++;
      }

      finalAnswers.push({
        questionId: q._id,
        selected: selected,
        isCorrect
      });
    });

    result.answers = finalAnswers;
    result.score = score;
    result.submittedAt = now;

    await result.save();

    return sendSuccess(res, 'Quiz submitted', result);
  } catch (err) {
    return sendError(res, err.message);
  }
};
