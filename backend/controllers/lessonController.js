const Lesson = require('../models/Lesson');
const { sendSuccess, sendError } = require('../utils/responseHandler');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.topicId) filter.topicId = req.query.topicId;

    const lessons = await Lesson.find(filter).populate('topicId', 'name').skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Lesson.countDocuments(filter);

    return sendSuccess(res, 'Success', { lessons, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('topicId', 'name');
    if (!lesson) return sendError(res, 'Lesson not found', 404);
    return sendSuccess(res, 'Success', lesson);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { title, content, topicId } = req.body;
    let imageUrl = req.body.imageUrl || null;
    let fileUrl = req.body.fileUrl || null;
    
    // If multer uploaded an image or file
    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        imageUrl = '/uploads/' + req.files.image[0].filename;
      }
      if (req.files.file && req.files.file.length > 0) {
        fileUrl = '/uploads/' + req.files.file[0].filename;
      }
    }

    const lesson = await Lesson.create({ title, content, imageUrl, fileUrl, topicId });
    return sendSuccess(res, 'Lesson created', lesson, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { title, content, topicId } = req.body;
    let updateData = { title, content, topicId };
    
    if (req.files) {
      if (req.files.image && req.files.image.length > 0) {
        updateData.imageUrl = '/uploads/' + req.files.image[0].filename;
      }
      if (req.files.file && req.files.file.length > 0) {
        updateData.fileUrl = '/uploads/' + req.files.file[0].filename;
      }
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!lesson) return sendError(res, 'Lesson not found', 404);
    
    return sendSuccess(res, 'Lesson updated', lesson);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) return sendError(res, 'Lesson not found', 404);
    return sendSuccess(res, 'Lesson deleted', lesson);
  } catch (err) {
    return sendError(res, err.message);
  }
};
