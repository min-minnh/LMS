const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const Quiz = require('../models/Quiz');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { uploadToGridFS } = require('../utils/gridfs');

// Helper to extract text from buffer (in-memory, no disk)
const extractText = async (buffer, mimetype, originalname) => {
  if (!buffer) return '';
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    (originalname && originalname.endsWith('.docx'))
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    // Plain text files
    return buffer.toString('utf8');
  }
};

exports.generateQuizFromFiles = async (req, res) => {
  try {
    const files = req.files || {};
    const docFile = files.document ? files.document[0] : null;
    const ansFile = files.answerKey ? files.answerKey[0] : null;
    const audio1  = files.audio1   ? files.audio1[0]   : null;
    const audio2  = files.audio2   ? files.audio2[0]   : null;

    if (!docFile) return sendError(res, 'Vui lòng tải lên file đề bài (PDF/DOCX).', 400);
    if (!ansFile) return sendError(res, 'Vui lòng tải lên file Đáp Án (TXT/DOCX).', 400);

    // 1. Extract text from answer key buffer (no disk I/O)
    const ansText = await extractText(ansFile.buffer, ansFile.mimetype, ansFile.originalname);

    // 2. Upload all files to GridFS → permanent URLs
    const docId    = await uploadToGridFS(docFile.buffer, docFile.originalname, docFile.mimetype);
    const ansId    = await uploadToGridFS(ansFile.buffer, ansFile.originalname, ansFile.mimetype);
    const audioUrl1 = audio1 ? `/files/${await uploadToGridFS(audio1.buffer, audio1.originalname, audio1.mimetype)}` : '';
    const audioUrl2 = audio2 ? `/files/${await uploadToGridFS(audio2.buffer, audio2.originalname, audio2.mimetype)}` : '';

    const originalFilesUrls = [`/files/${docId}`, `/files/${ansId}`];

    // 3. Scan answers using Regex
    const generatedQuestions = [];
    // Matches patterns like "1A", "1. A", "Câu 1: A", "Q1 - A"
    const regex = /(?:Câu|Question|Q)?\s*(\d+)[\.\-\:\)]?\s*([A-D])/gi;
    let match;
    const answerMap = {};

    while ((match = regex.exec(ansText)) !== null) {
      const qNum = parseInt(match[1]);
      const correctAns = match[2].toUpperCase();
      answerMap[qNum] = correctAns;
    }

    const qNumbers = Object.keys(answerMap).map(Number).sort((a, b) => a - b);
    if (qNumbers.length === 0) {
      return sendError(res, 'Không tìm thấy cấu trúc đáp án (1A, 2B...) trong file bạn tải lên.', 400);
    }

    const maxQ = qNumbers[qNumbers.length - 1];

    // Auto fill questions 1 to maxQ
    for (let i = 1; i <= maxQ; i++) {
      generatedQuestions.push({
        passage: '',
        question: `Câu ${i}`,
        optionA: 'A',
        optionB: 'B',
        optionC: 'C',
        optionD: 'D',
        correct: answerMap[i] || 'A'
      });
    }

    // 4. Save to Database
    const newQuiz = new Quiz({
      title: req.body.title || 'Đề thi tự động quét - ' + new Date().toLocaleDateString(),
      description: req.body.description || 'Đề thi được quét tự động. Vui lòng kiểm tra lại đáp án.',
      timeLimit: parseInt(req.body.timeLimit) || 3600,
      attemptLimit: parseInt(req.body.attemptLimit) || 0,
      status: 'Pending Review',
      aiGenerated: true,
      audioFile1: audioUrl1,
      audioFile2: audioUrl2,
      originalFiles: originalFilesUrls,
      questions: generatedQuestions
    });

    await newQuiz.save();

    return sendSuccess(res, 'Quét file thành công! Vui lòng đối chiếu đáp án.', newQuiz, 201);

  } catch (error) {
    console.error('Scanner Error:', error);
    return sendError(res, 'Đã xảy ra lỗi khi quét đề: ' + error.message, 500);
  }
};
