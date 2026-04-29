const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

/**
 * Upload a buffer to GridFS
 * @param {Buffer} buffer - File data
 * @param {string} filename - Original filename
 * @param {string} mimetype - MIME type
 * @returns {Promise<string>} - GridFS file ID as string
 */
function uploadToGridFS(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { mimetype }
    });

    readable.pipe(uploadStream);

    uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
    uploadStream.on('error', reject);
  });
}

/**
 * Stream a file from GridFS to HTTP response
 * @param {string} fileId - GridFS file ID
 * @param {object} res - Express response object
 */
async function streamFromGridFS(fileId, res) {
  const { ObjectId } = require('mongodb');
  const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

  let id;
  try {
    id = new ObjectId(fileId);
  } catch {
    res.status(400).json({ success: false, message: 'Invalid file ID' });
    return;
  }

  // Find file info for content-type
  const files = await bucket.find({ _id: id }).toArray();
  if (!files || files.length === 0) {
    res.status(404).json({ success: false, message: 'File not found' });
    return;
  }

  const file = files[0];
  const mimetype = file.metadata?.mimetype || 'application/octet-stream';

  res.set('Content-Type', mimetype);
  res.set('Content-Disposition', `inline; filename="${file.filename}"`);
  res.set('Cache-Control', 'public, max-age=31536000'); // cache 1 year

  const downloadStream = bucket.openDownloadStream(id);
  downloadStream.pipe(res);
  downloadStream.on('error', () => {
    if (!res.headersSent) {
      res.status(404).json({ success: false, message: 'File stream error' });
    }
  });
}

/**
 * Delete a file from GridFS by its ID string
 * @param {string} fileId
 */
async function deleteFromGridFS(fileId) {
  try {
    const { ObjectId } = require('mongodb');
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
    await bucket.delete(new ObjectId(fileId));
  } catch (err) {
    console.error('GridFS delete error:', err.message);
  }
}

module.exports = { uploadToGridFS, streamFromGridFS, deleteFromGridFS };
