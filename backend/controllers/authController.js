const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../utils/responseHandler');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 'Email already exists', 400);
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: 'student' });
    return sendSuccess(res, 'Success', user, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });

    // Fallback seed admin
    if (!user && email === 'minmin' && password === '1412kaitokid') {
      const hashed = await bcrypt.hash('1412kaitokid', 10);
      user = await User.create({
        name: 'Admin MinMin',
        email: 'minmin',
        password: hashed,
        role: 'admin'
      });
    }

    if (!user) return sendError(res, 'User not found', 404);

    const match = await bcrypt.compare(password, user.password);
    if (!match) return sendError(res, 'Invalid password', 401);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'abc123');
    
    // User JSON output will strip password automatically based on our toJSON config
    return sendSuccess(res, 'Login OK', { token, user });
  } catch (err) {
    return sendError(res, err.message);
  }
};
