const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseHandler');
const User = require('../models/User');

exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'abc123'); // fall back to abc123 for backward logic
    req.user = decoded; // Need { id: '...', role: '...' } inside token ideally, else we fetch
    
    // Always fetch user to ensure they still exist and get latest role
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }
    
    req.user = user; // Attach full user sans password (toJSON limits it)
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
};

exports.requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return sendError(res, 'Access Denied: Admins only', 403);
  }
};
