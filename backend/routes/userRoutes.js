const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Admin routes
router.get('/', requireAdmin, userController.getAll);
router.post('/', requireAdmin, userController.create);
router.put('/:id/role', requireAdmin, userController.updateRole);
router.delete('/:id', requireAdmin, userController.remove);

module.exports = router;
