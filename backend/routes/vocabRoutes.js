const express = require('express');
const router = express.Router();
const vocabController = require('../controllers/vocabController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { uploadCSV } = require('../middleware/uploadMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

router.use(verifyToken);

router.get('/', vocabController.getAll);

router.post('/', requireAdmin, [
  body('word').notEmpty().withMessage('Word is required'),
  body('meaning').notEmpty().withMessage('Meaning is required'),
  body('topicId').notEmpty().withMessage('topicId is required')
], validate, vocabController.create);

router.put('/:id', requireAdmin, [
  body('word').notEmpty().withMessage('Word is required'),
  body('meaning').notEmpty().withMessage('Meaning is required'),
  body('topicId').notEmpty().withMessage('topicId is required')
], validate, vocabController.update);

router.delete('/:id', requireAdmin, vocabController.remove);

router.post('/upload-csv', requireAdmin, uploadCSV.single('file'), vocabController.uploadCSV);

module.exports = router;
