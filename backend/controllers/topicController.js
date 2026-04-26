const Topic = require('../models/Topic');
const { sendSuccess, sendError } = require('../utils/responseHandler');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const topics = await Topic.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Topic.countDocuments(filter);
    return sendSuccess(res, 'Success', { topics, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, type } = req.body;
    const topic = await Topic.create({ name, type: type || 'general' });
    return sendSuccess(res, 'Topic created', topic, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    const topic = await Topic.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!topic) return sendError(res, 'Topic not found', 404);
    return sendSuccess(res, 'Topic updated', topic);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return sendError(res, 'Topic not found', 404);
    return sendSuccess(res, 'Topic deleted', topic);
  } catch (err) {
    return sendError(res, err.message);
  }
};
