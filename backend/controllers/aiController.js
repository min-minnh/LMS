const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const Quiz = require('../models/Quiz');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Helper to extract text from file
const extractText = async (filePath, mimetype) => {
  if (!filePath) return '';
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filePath.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    // Fallback for simple text files or unknown
    return fs.readFileSync(filePath, 'utf8');
  }
};

exports.generateQuizFromFiles = async (req, res) => {
  try {
    const files = req.files || {};
    const docFile = files.document ? files.document[0] : null;
    const ansFile = files.answerKey ? files.answerKey[0] : null;
    const audio1 = files.audio1 ? files.audio1[0] : null;
    const audio2 = files.audio2 ? files.audio2[0] : null;

    if (!docFile) return sendError(res, 'Vui lòng tải lên file đề bài (PDF/DOCX).', 400);
    if (!ansFile) return sendError(res, 'Vui lòng tải lên file Đáp Án (TXT/DOCX).', 400);

    // 1. Extract Text from Answer Key
    const ansText = await extractText(ansFile.path, ansFile.mimetype);

    // 2. Setup URLs
    const audioUrl1 = audio1 ? `/uploads/${audio1.filename}` : '';
    const audioUrl2 = audio2 ? `/uploads/${audio2.filename}` : '';
    const originalFilesUrls = [
      `/uploads/${docFile.filename}`,
      `/uploads/${ansFile.filename}`
    ];

    // 3. Scan Answers using Regex
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

    const qNumbers = Object.keys(answerMap).map(Number).sort((a,b)=>a-b);
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
        correct: answerMap[i] || 'A' // Default to A if missing from answer key
      });
    }

    // 4. Save to Database as Pending Review
    const newQuiz = new Quiz({
      title: req.body.title || 'Đề thi tự động quét - ' + new Date().toLocaleDateString(),
      description: req.body.description || 'Đề thi được quét tự động. Vui lòng kiểm tra lại đáp án.',
      timeLimit: parseInt(req.body.timeLimit) || 3600,
      attemptLimit: parseInt(req.body.attemptLimit) || 0,
      status: 'Pending Review',
      aiGenerated: true, // keep flag for badge
      audioFile1: audioUrl1,
      audioFile2: audioUrl2,
      originalFiles: originalFilesUrls,
      questions: generatedQuestions
    });

    await newQuiz.save();

    return sendSuccess(res, 'Quét file thành công! Vui lòng đối chiếu đáp án.', newQuiz, 201);

  } catch (error) {
    console.error("Scanner Error:", error);
    return sendError(res, 'Đã xảy ra lỗi khi quét đề: ' + error.message, 500);
  }
};
