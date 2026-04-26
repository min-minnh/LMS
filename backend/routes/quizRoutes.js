const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { uploadCSV } = require('../middleware/uploadMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

router.use(verifyToken);

router.get('/', quizController.getAll);
router.get('/:id', quizController.getById);

router.post('/', requireAdmin, [
  body('title').notEmpty().withMessage('Title is required'),
  body('timeLimit').isNumeric().withMessage('timeLimit (seconds) is required')
], validate, quizController.create);

router.put('/:id', requireAdmin, [
  body('title').notEmpty().withMessage('Title is required'),
  body('timeLimit').isNumeric().withMessage('timeLimit (seconds) is required')
], validate, quizController.update);

router.delete('/:id', requireAdmin, quizController.remove);

// Question routes
router.post('/:id/questions', requireAdmin, [
  body('question').notEmpty(),
  body('optionA').notEmpty(),
  body('optionB').notEmpty(),
  body('optionC').notEmpty(),
  body('optionD').notEmpty(),
  body('correct').isIn(['A','B','C','D'])
], validate, quizController.addQuestion);

router.put('/:id/questions/:qId', requireAdmin, [
  body('question').notEmpty(),
  body('optionA').notEmpty(),
  body('optionB').notEmpty(),
  body('optionC').notEmpty(),
  body('optionD').notEmpty(),
  body('correct').isIn(['A','B','C','D'])
], validate, quizController.updateQuestion);

router.delete('/:id/questions/:qId', requireAdmin, quizController.removeQuestion);

router.post('/:id/upload-csv', requireAdmin, uploadCSV.single('file'), quizController.uploadCSV);

module.exports = router;
