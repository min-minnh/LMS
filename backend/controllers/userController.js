const User = require('../models/User');
const Result = require('../models/Result');
const bcrypt = require('bcrypt');
const { sendSuccess, sendError } = require('../utils/responseHandler');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find({}).skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await User.countDocuments({});
    
    return sendSuccess(res, 'Success', { users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return sendError(res, 'Email already exists', 400);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role: role || 'student' });
    return sendSuccess(res, 'User created', { _id: user._id, name: user.name, email: user.email, role: user.role }, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    return sendSuccess(res, 'Role updated', user);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    
    // Optional: We might want to keep the results or delete them. In many systems, we delete them too.
    await Result.deleteMany({ userId: req.params.id });

    return sendSuccess(res, 'User deleted', user);
  } catch (err) {
    return sendError(res, err.message);
  }
};
