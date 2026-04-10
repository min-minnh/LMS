const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { uploadAny } = require('../middleware/uploadMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

router.use(verifyToken);

router.get('/', lessonController.getAll);
router.get('/:id', lessonController.getById);

router.post('/', requireAdmin, uploadAny.fields([{name: 'image', maxCount: 1}, {name: 'file', maxCount: 1}]), [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('topicId').notEmpty().withMessage('topicId is required')
], validate, lessonController.create);

router.put('/:id', requireAdmin, uploadAny.fields([{name: 'image', maxCount: 1}, {name: 'file', maxCount: 1}]), [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('topicId').notEmpty().withMessage('topicId is required')
], validate, lessonController.update);

router.delete('/:id', requireAdmin, lessonController.remove);

module.exports = router;
