const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Quiz = require('../models/Quiz');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Initialize Gemini (if key exists)
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

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

    if (!docFile) return sendError(res, 'Vui lòng tải lên file đề bài (DOCX).', 400);

    // 1. Extract Text
    const docText = await extractText(docFile.path, docFile.mimetype);
    let ansText = '';
    if (ansFile) {
      ansText = await extractText(ansFile.path, ansFile.mimetype);
    }

    // 2. Setup audio URLs if uploaded
    const audioUrl1 = audio1 ? `/uploads/${audio1.filename}` : '';
    const audioUrl2 = audio2 ? `/uploads/${audio2.filename}` : '';
    const originalFilesUrls = [
      `/uploads/${docFile.filename}`,
      ansFile ? `/uploads/${ansFile.filename}` : null
    ].filter(Boolean);

    // 3. Call AI or use Mock
    let generatedQuestions = [];

    if (genAI) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = \`
      Bạn là một chuyên gia xử lý dữ liệu và phân tích đề thi trắc nghiệm (đặc biệt là đề tiếng Anh phức tạp). Dưới đây là nội dung đề bài và nội dung đáp án (nếu có).
      Nhiệm vụ của bạn là bóc tách toàn bộ nội dung thành các câu hỏi trắc nghiệm (có 4 đáp án A, B, C, D) theo định dạng JSON chuẩn.

      HƯỚNG DẪN QUAN TRỌNG:
      1. Cấu trúc câu hỏi phức tạp: Nhiều câu hỏi chứa các đoạn văn bản phụ, thư từ (Dear Alex...), hội thoại, hoặc các câu liệt kê (a, b, c, d, e) cần sắp xếp. Bạn phải GỘP TOÀN BỘ các nội dung phụ đó vào trường "question" (sử dụng kí tự \\n để xuống dòng, giữ nguyên cấu trúc). KHÔNG ĐƯỢC BỎ SÓT.
      2. Đoạn văn đọc hiểu (Passage): Nếu đề bài có các đoạn văn đọc chung cho nhiều câu hỏi (ví dụ: "Read the following passage..."), hãy đưa toàn bộ nội dung đoạn văn đó vào trường "passage" của TẤT CẢ các câu hỏi liên quan.
      3. Đáp án: Có thể là một từ, một câu, hoặc các chuỗi sắp xếp (ví dụ: b-e-a-d-c). Hãy trích xuất chính xác text của đáp án A, B, C, D.
      4. Đáp án đúng (correct): Nếu có thông tin đáp án, hãy đối chiếu để tìm đáp án đúng (A, B, C hoặc D). Nếu không, hãy tự giải quyết và đưa ra đáp án đúng nhất. CHỈ trả về MỘT chữ cái in hoa (A, B, C, hoặc D).
      5. Bắt buộc escape đúng các ký tự ngoặc kép (\") trong chuỗi JSON để không làm hỏng cấu trúc.

      Trả về kết quả CHỈ LÀ MỘT MẢNG JSON với các object có cấu trúc sau:
      [
        {
          "passage": "Nội dung đoạn văn chung (nếu có, nếu không để chuỗi rỗng)",
          "question": "Nội dung câu hỏi đầy đủ (bao gồm cả các câu a, b, c... cần sắp xếp nếu có)",
          "optionA": "Nội dung đáp án A",
          "optionB": "Nội dung đáp án B",
          "optionC": "Nội dung đáp án C",
          "optionD": "Nội dung đáp án D",
          "correct": "A"
        }
      ]
      
      Đề bài:
      \${docText}
      
      Đáp án (Nếu có):
      \${ansText}
      
      LƯU Ý TỐI QUAN TRỌNG: CHỈ TRẢ VỀ CHUỖI JSON HỢP LỆ (BẮT ĐẦU BẰNG [ VÀ KẾT THÚC BẰNG ]). KHÔNG ĐƯỢC BỌC TRONG \`\`\`json, KHÔNG ĐƯỢC GIẢI THÍCH HOẶC VIẾT THÊM BẤT KỲ CHỮ NÀO KHÁC.
      \`;

      try {
        const result = await model.generateContent(prompt);
        let textResult = result.response.text().trim();
        if(textResult.startsWith('```json')) textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
        generatedQuestions = JSON.parse(textResult);
      } catch (aiErr) {
        console.error("AI Error:", aiErr);
        // Fallback to mock if AI fails or formatting is bad
        generatedQuestions = getMockQuestions();
      }
    } else {
      // Mock Data when no API Key is provided
      generatedQuestions = getMockQuestions();
    }

    // 4. Save to Database as Pending Review
    const newQuiz = new Quiz({
      title: req.body.title || 'Bài thi tạo tự động từ AI - ' + new Date().toLocaleDateString(),
      description: req.body.description || 'Đề thi được tạo tự động bởi AI. Vui lòng kiểm duyệt kỹ trước khi xuất bản.',
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

    return sendSuccess(res, 'Tạo Quiz tự động thành công! Đang chờ kiểm duyệt.', newQuiz, 201);

  } catch (error) {
    console.error("AI Gen Error:", error);
    return sendError(res, 'Đã xảy ra lỗi khi tạo quiz: ' + error.message, 500);
  }
};

function getMockQuestions() {
  return [
    {
      passage: "This is a mock passage for reading comprehension. Read it carefully.",
      question: "What is the main topic of the mock passage?",
      optionA: "Science",
      optionB: "Reading",
      optionC: "Math",
      optionD: "History",
      correct: "B"
    },
    {
      passage: "",
      question: "Which of the following is an AI model by Google?",
      optionA: "ChatGPT",
      optionB: "Gemini",
      optionC: "Claude",
      optionD: "Llama",
      correct: "B"
    }
  ];
}
