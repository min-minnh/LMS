const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', resultController.getAll);
router.get('/:id', resultController.getById);

// Action endpoints for quizzes
router.post('/quiz/:quizId/start', resultController.startQuiz);
router.post('/quiz/:quizId/submit', resultController.submitQuiz);
router.delete('/:id', requireAdmin, resultController.deleteResult);

module.exports = router;
