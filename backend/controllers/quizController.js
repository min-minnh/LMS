const Quiz = require('../models/Quiz');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { parseXLSXBuffer } = require('../utils/csvParser');

exports.create = async (req, res) => {
  try {
    const { title, description, timeLimit, attemptLimit, shuffleQuestions } = req.body;
    const quiz = await Quiz.create({ 
      title, 
      description, 
      timeLimit, 
      attemptLimit: attemptLimit || 0,
      shuffleQuestions: !!shuffleQuestions 
    });
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
    const { title, description, timeLimit, attemptLimit, shuffleQuestions, status } = req.body;
    const updateFields = { title, description, timeLimit };
    if (attemptLimit !== undefined) updateFields.attemptLimit = attemptLimit;
    if (shuffleQuestions !== undefined) updateFields.shuffleQuestions = shuffleQuestions;
    if (status) updateFields.status = status;
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
      {
        $set: {
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
      const parseCSV = (text) => {
        const rows = [];
        let currentRow = [];
        let currentField = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (char === '"' && inQuotes && nextChar === '"') {
            currentField += '"';
            i++; 
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = "";
          } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\r' && nextChar === '\n') i++; 
            currentRow.push(currentField.trim());
            if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
              rows.push(currentRow);
            }
            currentRow = [];
            currentField = "";
          } else {
            currentField += char;
          }
        }
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== "")) {
            rows.push(currentRow);
          }
        }
        return rows;
      };

      const rows = parseCSV(req.body.csvText);
      if (rows.length > 0) {
        let headers = rows[0];
        let startIdx = 1;

        // Auto-detect header
        const headerStr = headers.join(",").toLowerCase();
        if (!headerStr.includes("question") && !headerStr.includes("correct") && !headerStr.includes("option")) {
          headers = ["passage", "question", "optionA", "optionB", "optionC", "optionD", "correct"];
          startIdx = 0;
        }

        for (let i = startIdx; i < rows.length; i++) {
          const cols = rows[i];
          if (cols.length < 2) continue;

          let obj = {};
          headers.forEach((h, idx) => {
            if (h) {
              const cleanHeader = h.trim().toLowerCase();
              obj[cleanHeader] = cols[idx] || "";
            }
          });
          data.push(obj);
        }
      }
    }
 else {
      const file = req.file;
      if (!file) return sendError(res, 'Please upload a CSV file or paste content', 400);
      data = await parseXLSXBuffer(file.buffer, file.originalname);
    }
    let successCount = 0;
    let errorRows = [];

    const validOptions = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 2;

      const passage = (row.passage || "").toString().trim();
      const question = (row.question || row.q || "").toString().trim();
      const optionA = (row.optiona || row.option1 || row.a || "").toString().trim();
      const optionB = (row.optionb || row.option2 || row.b || "").toString().trim();
      const optionC = (row.optionc || row.option3 || row.c || "").toString().trim();
      const optionD = (row.optiond || row.option4 || row.d || "").toString().trim();
      const correct = (row.correct || row.correctanswer || row.ans || "").toString().trim().toUpperCase();

      if (!question || !optionA || !optionB || !optionC || !optionD || !correct) {
        errorRows.push({ row: rowIndex, reason: 'Missing required field (Check columns/headers)' });
        continue;
      }

      if (!validOptions.includes(correct)) {
        errorRows.push({ row: rowIndex, reason: `Invalid correct answer: '${correct}' (Must be A, B, C, or D)` });
        continue;
      }

      quiz.questions.push({ passage, question, optionA, optionB, optionC, optionD, correct });
      successCount++;
    }

    await quiz.save();
    return sendSuccess(res, 'Questions imported', { successCount, errorRows });
  } catch (err) {
    return sendError(res, err.message);
  }
};
