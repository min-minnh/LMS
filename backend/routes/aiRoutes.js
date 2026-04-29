const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');

// Memory storage — files go to GridFS, not disk
const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);
router.use(requireAdmin);

// Accept multiple files: document, answerKey, audio1, audio2
router.post('/generate', upload.fields([
  { name: 'document',  maxCount: 1 },
  { name: 'answerKey', maxCount: 1 },
  { name: 'audio1',   maxCount: 1 },
  { name: 'audio2',   maxCount: 1 }
]), aiController.generateQuizFromFiles);

module.exports = router;
