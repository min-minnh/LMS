const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer storage config for uploading multiple files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.use(verifyToken);
router.use(requireAdmin);

// Accept multiple files: document, answerKey, audio1, audio2
router.post('/generate', upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'answerKey', maxCount: 1 },
  { name: 'audio1', maxCount: 1 },
  { name: 'audio2', maxCount: 1 }
]), aiController.generateQuizFromFiles);

module.exports = router;
