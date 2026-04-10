const Vocabulary = require('../models/Vocabulary');
const Topic = require('../models/Topic');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { parseXLSX } = require('../utils/csvParser');
const fs = require('fs');

exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let filter = {};
    if (req.query.topicId) {
      filter.topicId = req.query.topicId;
    }

    const vocab = await Vocabulary.find(filter).populate('topicId', 'name').skip(skip).limit(limit).sort({ createdAt: -1 });
    const total = await Vocabulary.countDocuments(filter);
    
    return sendSuccess(res, 'Success', { vocab, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.create = async (req, res) => {
  try {
    const { word, meaning, example, topicId } = req.body;
    const existing = await Vocabulary.findOne({ word, topicId });
    if (existing) return sendError(res, 'Word already exists in this topic', 400);

    const vocab = await Vocabulary.create({ word, meaning, example, topicId });
    return sendSuccess(res, 'Vocabulary created', vocab, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.update = async (req, res) => {
  try {
    const { word, meaning, example, topicId } = req.body;
    const vocab = await Vocabulary.findByIdAndUpdate(req.params.id, { word, meaning, example, topicId }, { new: true });
    if (!vocab) return sendError(res, 'Vocabulary not found', 404);
    return sendSuccess(res, 'Vocabulary updated', vocab);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.remove = async (req, res) => {
  try {
    const vocab = await Vocabulary.findByIdAndDelete(req.params.id);
    if (!vocab) return sendError(res, 'Vocabulary not found', 404);
    return sendSuccess(res, 'Vocabulary deleted', vocab);
  } catch (err) {
    return sendError(res, err.message);
  }
};

exports.uploadCSV = async (req, res) => {
  try {
    let data = [];
    
    // Support either direct csvText paste OR file upload
    if (req.body.csvText) {
      const lines = req.body.csvText.split('\n');
      if (lines.length > 0) {
        let headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const colStr = lines[i].trim();
          if (!colStr) continue;
          
          // Split keeping commas inside quotes if any, simplistic:
          const cols = colStr.split(',').map(c => c.trim());
          let obj = {};
          headers.forEach((h, idx) => {
            if (h) obj[h] = cols[idx] || '';
          });
          data.push(obj);
        }
      }
    } else {
      const file = req.file;
      if (!file) return sendError(res, 'Please upload a CSV file or paste content', 400);
      data = await parseXLSX(file.path);
    }
    let successCount = 0;
    let errorRows = [];

    const explicitTopicId = req.body.topicId;

    // Cache topics to avoid repetitive DB calls
    const topicCache = {}; // { "topicName": ObjectId }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 2; // +1 for 0-index, +1 for Header

      const word = (row.word || '').toString().trim();
      const meaning = (row.meaning || '').toString().trim();
      const example = (row.example || '').toString().trim();
      const topicName = (row.topic || '').toString().trim();

      if (!word || !meaning) {
        errorRows.push({ row: rowIndex, reason: 'Missing required fields (word, meaning)' });
        continue;
      }

      let tId = explicitTopicId;
      
      // If we are not forced into a specific topic, we MUST have a topicName
      if (!tId) {
        if (!topicName) {
           errorRows.push({ row: rowIndex, reason: 'Missing topic column' });
           continue;
        }
        // Upsert topic
        tId = topicCache[topicName];
        if (!tId) {
          let topicDoc = await Topic.findOne({ name: topicName });
          if (!topicDoc) {
            topicDoc = await Topic.create({ name: topicName });
          }
          tId = topicDoc._id;
          topicCache[topicName] = tId;
        }
      }

      // Check duplicate
      const existing = await Vocabulary.findOne({ word, topicId: tId });
      if (existing) {
        errorRows.push({ row: rowIndex, reason: `Duplicate word '${word}' in this topic` });
        continue;
      }

      await Vocabulary.create({ word, meaning, example, topicId: tId });
      successCount++;
    }

    // Cleanup uploaded file
    if (req.file) fs.unlinkSync(req.file.path);

    return sendSuccess(res, 'Upload processed', { successCount, errorRows });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    return sendError(res, err.message);
  }
};
