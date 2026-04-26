const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');

router.use(verifyToken);

router.get('/', topicController.getAll);

router.post('/', requireAdmin, [
  body('name').notEmpty().withMessage('Name is required')
], validate, topicController.create);

router.put('/:id', requireAdmin, [
  body('name').notEmpty().withMessage('Name is required')
], validate, topicController.update);

router.delete('/:id', requireAdmin, topicController.remove);

module.exports = router;
